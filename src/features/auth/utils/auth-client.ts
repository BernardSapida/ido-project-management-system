import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./better-auth";

export const authClient = createAuthClient({
	baseURL: typeof window !== "undefined" ? window.location.origin : "http://localhost:4000",
	plugins: [
		// Teaches the client about the custom user columns declared in
		// `user.additionalFields` on the server. Without this the client only knows
		// Better Auth's built-ins (name/image), so `updateUser({ firstname })` is a
		// type error even though the server accepts it.
		//
		// Inferred from the server `auth` type rather than re-declared as a literal,
		// so the two cannot drift. The import is `import type`, erased at compile
		// time - no server code (Prisma, the secret) reaches the client bundle.
		inferAdditionalFields<typeof auth>(),
	],
});

export type AuthClient = typeof authClient;
