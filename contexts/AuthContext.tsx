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

	// Takes an explicit id because the first call happens during sign-in, before
	// the `user` state has been committed — reading it from the closure there
	// would always see null and return early.
	const refreshProfile = useCallback(
		async (userId?: string) => {
			const id = userId ?? user?.id;
			if (!id) return;
			const { data, error } = await supabase
				.from("profiles")
				.select("username")
				.eq("user_id", id)
				.maybeSingle();

			if (!error && data) setProfile({ username: data.username });
		},
		[user?.id],
	);

	useEffect(() => {
		const initSession = async () => {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			setSession(session);
			setUser(session?.user ?? null);
			if (session?.user) await refreshProfile(session.user.id);
			setIsLoading(false);
		};
		initSession();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (_event, session) => {
			setSession(session);
			setUser(session?.user ?? null);
			if (session?.user) await refreshProfile(session.user.id);
			else setProfile(null);
			setIsLoading(false);
		});
		return () => subscription?.unsubscribe();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

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
