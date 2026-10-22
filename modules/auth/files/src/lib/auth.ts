import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { env } from "cloudflare:workers";
import * as schema from "#/db/schema";
import { getDb } from "#/lib/db";

let instance: ReturnType<typeof create> | undefined;

function create() {
	return betterAuth({
		database: drizzleAdapter(getDb(), { provider: "sqlite", schema }),
		secret: env.BETTER_AUTH_SECRET,
		emailAndPassword: { enabled: true },
		// Must stay the last plugin.
		plugins: [tanstackStartCookies()],
	});
}

/** Better Auth instance, created on first use because bindings exist only at request time. */
export const getAuth = () => {
	instance ??= create();
	return instance;
};
