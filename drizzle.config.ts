import { defineConfig } from "drizzle-kit";

// Only used to generate SQL migrations (yarn db:generate). Wrangler applies them to D1.
export default defineConfig({
	dialect: "sqlite",
	schema: "./src/db/schema.ts",
	out: "./migrations",
});
