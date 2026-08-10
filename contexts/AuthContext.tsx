"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { User, Session } from "@supabase/supabase-js";

interface Profile {
	username: string;
}

interface AuthContextType {
	user: User | null;
	session: Session | null;
	isLoading: boolean;
	signOut: () => Promise<void>;
	profile: Profile | null;
	refreshProfile: (userId?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	// Starts true: until the first getSession() resolves we genuinely do not
	// know whether anyone is signed in, and consumers must be able to tell that
	// apart from "signed out".
	const [isLoading, setIsLoading] = useState(true);
	const [profile, setProfile] = useState<Profile | null>(null);
	const userId = user?.id;

	const loadProfile = useCallback(async (id: string) => {
		const { data, error } = await supabase
			.from("profiles")
			.select("username")
			.eq("user_id", id)
			.maybeSingle();

		if (error) {
			console.error(error);
			return;
		}
		setProfile(data ? { username: data.username } : null);
	}, []);

	// Exposed so the profile form can refresh the name it just saved.
	const refreshProfile = useCallback(
		async (userId?: string) => {
			const id = userId ?? user?.id;
			if (!id) return;
			await loadProfile(id);
		},
		[user?.id, loadProfile],
	);

	useEffect(() => {
		let cancelled = false;

		supabase.auth.getSession().then(({ data: { session } }) => {
			if (cancelled) return;
			setSession(session);
			setUser(session?.user ?? null);
			setIsLoading(false);
		});

		// This callback must stay synchronous. supabase-js holds an auth lock
		// while it runs, so awaiting another Supabase call inside it waits on a
		// lock the callback itself is holding — the client deadlocks and every
		// later query hangs. Loading the profile is done by the effect below,
		// which runs outside the lock.
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			if (cancelled) return;
			setSession(session);
			setUser(session?.user ?? null);
			setIsLoading(false);
		});

		return () => {
			cancelled = true;
			subscription?.unsubscribe();
		};
	}, []);

	// Profile follows whoever is signed in, keyed on the id so it reloads on
	// sign-in and clears on sign-out.
	useEffect(() => {
		let cancelled = false;

		async function syncProfile() {
			if (!userId) {
				if (!cancelled) setProfile(null);
				return;
			}
			await loadProfile(userId);
		}
		syncProfile();

		return () => {
			cancelled = true;
		};
	}, [userId, loadProfile]);

	const signOut = async () => {
		await supabase.auth.signOut();
		setUser(null);
		setSession(null);
		setProfile(null);
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				session,
				isLoading,
				signOut,
				profile,
				refreshProfile,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined)
		throw new Error("useAuth was used outside of AuthProvider");
	return context;
}

export { AuthProvider, useAuth };
