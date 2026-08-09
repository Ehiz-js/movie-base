type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/**
 * Fixed-window limiter keyed per caller.
 *
 * State lives in the instance's memory, so on a serverless host each instance
 * counts separately and the effective limit is per instance rather than
 * global. That is enough to stop one signed-in user hammering the mailer,
 * which is what this guards; a hard global cap would need shared storage.
 */
export function rateLimit(
	key: string,
	{ limit, windowMs }: { limit: number; windowMs: number },
): { allowed: boolean; retryAfterSeconds: number } {
	const now = Date.now();
	const bucket = buckets.get(key);

	if (!bucket || now >= bucket.resetAt) {
		buckets.set(key, { count: 1, resetAt: now + windowMs });
		return { allowed: true, retryAfterSeconds: 0 };
	}

	// Drop windows that have already expired so the map cannot grow without
	// bound as users come and go.
	if (buckets.size > 5000) {
		for (const [existingKey, existing] of buckets) {
			if (now >= existing.resetAt) buckets.delete(existingKey);
		}
	}

	if (bucket.count >= limit) {
		return {
			allowed: false,
			retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
		};
	}

	bucket.count += 1;
	return { allowed: true, retryAfterSeconds: 0 };
}
