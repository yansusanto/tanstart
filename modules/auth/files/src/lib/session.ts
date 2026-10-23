import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { getAuth, googleEnabled } from "#/lib/auth";

/** Current session (user and session) or null. Safe to call from route loaders. */
export const getSession = createServerFn({ method: "GET" }).handler(
	async () => {
		return getAuth().api.getSession({ headers: getRequestHeaders() });
	},
);

/** Whether the login page should show the Google button. */
export const getGoogleEnabled = createServerFn({ method: "GET" }).handler(
	async () => googleEnabled(),
);
