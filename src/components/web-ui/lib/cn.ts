import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes so a caller's `className` overrides a default instead of
 * fighting it.
 *
 * The first module to live here, deliberately: 80 of the components import it,
 * so it is the one that proves the whole chain - build, types, externals - before
 * anything harder moves. `apps/web/src/utils/cn.ts` becomes a re-export of this,
 * which keeps the 14 app-side importers and the path named in
 * `infrastructure/web/features/ui-components.md` working unchanged.
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
