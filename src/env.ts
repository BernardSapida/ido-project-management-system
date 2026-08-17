import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		BETTER_AUTH_SECRET: z.string().min(1),
		DATABASE_URL: z.string().min(1),
		SERVER_URL: z.url().optional(),
		NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
		MOBILE_DEV_URL: z.string().optional(),
		APP_VERSION: z.string().default("1.0.0"),
		MINIMUM_APP_VERSION: z.string().default("1.0.0"),
		MAINTENANCE_MODE: z.string().default("false"),
		MAINTENANCE_MESSAGE: z.string().optional(),
		PUSHER_APP_SECRET: z.string().optional(),
		PUSHER_APP_ID: z.string().optional(),

		/**
		 * S3 image storage. All four or none — `assertS3Config` in
		 * `src/lib/s3.server.ts` is what turns a half-filled set into one clear
		 * error at upload time.
		 *
		 * Optional here on purpose: a project built from this template that does
		 * not upload anything still boots, runs and passes typecheck without an
		 * AWS account. Only the upload endpoint fails, and it says why.
		 */
		AWS_REGION: z.string().optional(),
		AWS_S3_BUCKET: z.string().optional(),
		AWS_ACCESS_KEY_ID: z.string().optional(),
		AWS_SECRET_ACCESS_KEY: z.string().optional(),
	},

	/**
	 * The prefix that client-side variables must have. This is enforced both at
	 * a type-level and at runtime.
	 */
	clientPrefix: "VITE_",

	client: {
		VITE_BASE_URL: z.url().default("http://localhost:4000"),
		VITE_PUSHER_KEY: z.string().optional(),
		VITE_PUSHER_CLUSTER: z.string().default("ap1"),
	},

	/**
	 * What object holds the environment variables at runtime. This is usually
	 * `process.env` or `import.meta.env`.
	 */
	runtimeEnv: {
		...(typeof process !== "undefined" ? process.env : {}),
		...import.meta.env,
	},

	/**
	 * By default, this library will feed the environment variables directly to
	 * the Zod validator.
	 *
	 * This means that if you have an empty string for a value that is supposed
	 * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
	 * it as a type mismatch violation. Additionally, if you have an empty string
	 * for a value that is supposed to be a string with a default value (e.g.
	 * `DOMAIN=` in an ".env" file), the default value will never be applied.
	 *
	 * In order to solve these issues, we recommend that all new projects
	 * explicitly specify this option as true.
	 */
	emptyStringAsUndefined: true,
});
