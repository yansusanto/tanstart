import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { env } from "cloudflare:workers";
import * as schema from "#/db/schema";
import { getDb } from "#/lib/db";

let instance: ReturnType<typeof create> | undefined;

const google = () => {
	const { GOOGLE_CLIENT_ID: clientId, GOOGLE_CLIENT_SECRET: clientSecret } =
		env as unknown as Record<string, string | undefined>;
	return clientId && clientSecret ? { clientId, clientSecret } : undefined;
};

/** Google sign-in is offered only when both credentials are set. */
export const googleEnabled = () => Boolean(google());

function create() {
	const googleProvider = google();
	return betterAuth({
		database: drizzleAdapter(getDb(), { provider: "sqlite", schema }),
		secret: env.BETTER_AUTH_SECRET,
		emailAndPassword: { enabled: true },
		socialProviders: googleProvider ? { google: googleProvider } : {},
		// Must stay the last plugin.
		plugins: [tanstackStartCookies()],
	});
}

/** Better Auth instance, created on first use because bindings exist only at request time. */
export const getAuth = () => {
	instance ??= create();
	return instance;
};
