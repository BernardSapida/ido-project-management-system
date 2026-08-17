/**
 * The dev-only endpoint behind the customizer's "Save this palette" button.
 *
 * ## This reverses a decision, deliberately
 *
 * `theme.config.ts` says the customizer "previews into localStorage and NEVER
 * writes here", and the copy panel used to say "nothing here writes it for you -
 * a preview that quietly became the project default is a change that ships
 * unnoticed". That was the right instinct aimed at the wrong risk.
 *
 * What actually shipped unnoticed was the opposite failure. The flow it produced
 * was: press a button, get a command, switch to a terminal, paste it, watch it
 * fail on something the page could have validated, fix it by hand, run it again,
 * reload. Every one of those steps is a place to stop halfway, and stopping
 * halfway is what leaves a preset written with no CSS generated for it - a
 * palette that typechecks, exists, and is never painted.
 *
 * The safety the old rule was buying is still there, and it was never the
 * clipboard providing it:
 *
 *   - This runs in the DEV SERVER ONLY. `apply: "serve"` means it is not in the
 *     production build at all, so there is no endpoint to reach in a deployed
 *     app - not a guarded one, an absent one.
 *   - It writes tracked source. `git diff` is the review, exactly as it was when
 *     a human pasted the same command.
 *   - It runs the SAME script with the SAME flags. There is no second code path
 *     that could disagree with the documented one, and the command is still
 *     shown so it can be run by hand or committed to a script.
 *
 * ## Why a middleware and not a route
 *
 * A TanStack server route would ship in the production bundle and then need a
 * runtime guard, and a runtime guard is a thing that can be wrong. A Vite plugin
 * with `apply: "serve"` cannot be wrong about this: the code is not there.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Plugin } from "vite";

const run = promisify(execFile);

/**
 * Everything the generator will accept, so nothing else can reach a shell.
 *
 * This list is the second half of a pair, and it is the half that gets
 * forgotten. `configOutput` in `theme-draft.ts` decides which flags the page
 * sends; a control added there and not added HERE does not degrade to ignoring
 * that one flag - `argvFrom` rejects the whole body, so pressing Apply writes
 * nothing at all and the toast blames a flag the generator has supported all
 * along. That is what `--color-scheme` did: the customizer grew the control, the
 * generator grew the flag, and every apply from the page failed until this array
 * caught up. `vite-plugin-apply-theme.test.ts` now fails when they drift.
 */
export const FLAGS = [
	"--apply",
	"--use",
	"--colors",
	"--font",
	"--ui-radius",
	"--form-radius",
	"--surface",
	"--card",
	"--color-scheme",
	// Which theme the supplied brand hex is the real brand for. Exactly the drift
	// the comment above describes: the customizer grew the control and the
	// generator grew the flag, and every Apply would have failed until this caught
	// up - `argvFrom` rejects the whole body, not just the flag it does not know.
	"--brand-theme",
] as const;

export interface ApplyThemeResult {
	error?: string;
	ok: boolean;
	output: string;
}

/**
 * Rebuild the argv from a known list rather than forwarding what was sent.
 *
 * `execFile` does not spawn a shell, so this is not defending against `; rm -rf`
 * - it is defending against the quieter version: a typo'd or renamed flag being
 * passed through, ignored by the script, and silently producing a palette that
 * is not the one on screen. An unknown key is a bug worth failing on rather than
 * dropping.
 */
function argvFrom(body: Record<string, unknown>): string[] {
	const argv: string[] = [];

	for (const flag of FLAGS) {
		const value = body[flag];
		if (value === undefined || value === null || value === "") continue;
		if (typeof value !== "string") throw new Error(`${flag} must be a string`);
		argv.push(flag, value);
	}

	/*
	 * One of the two, and not both. `--apply` upserts a preset from values;
	 * `--use` commits one that already exists. Sending both would leave the
	 * generator to pick, and which it picks is not something this endpoint should
	 * be silently deciding on somebody's behalf.
	 */
	const verbs = argv.filter((token) => token === "--apply" || token === "--use");
	if (verbs.length === 0) throw new Error("--apply or --use is required - there is no palette to write without one");
	if (verbs.length > 1) throw new Error("--apply and --use are alternatives - send one");
	const unknown = Object.keys(body).filter((key) => !(FLAGS as readonly string[]).includes(key));
	if (unknown.length > 0) throw new Error(`unknown flag(s): ${unknown.join(", ")}`);

	return argv;
}

export function applyThemePlugin(): Plugin {
	return {
		// SERVE only. This is the whole security model - see the header.
		apply: "serve",
		configureServer(server) {
			server.middlewares.use("/__apply-theme", (request, response, next) => {
				if (request.method !== "POST") return next();

				let raw = "";
				request.on("data", (chunk) => {
					raw += chunk;
				});
				request.on("end", async () => {
					const send = (status: number, payload: ApplyThemeResult) => {
						response.statusCode = status;
						response.setHeader("content-type", "application/json");
						response.end(JSON.stringify(payload));
					};

					try {
						const argv = argvFrom(JSON.parse(raw || "{}"));
						/*
						 * The generator's own exit code is the verdict. It refuses to write a
						 * solved palette that fails its bars and it writes a designer's
						 * verbatim either way, and both of those behaviours belong to it -
						 * re-deciding them here would be a second opinion that could drift
						 * from the one the terminal gives.
						 */
						/*
						 * The generator is invoked DIRECTLY, not through a workspace filter.
						 *
						 * project-template is a monorepo and runs this as
						 * `pnpm --filter @app/web generate:palettes`. This project is flat, and
						 * that command is not merely wrong here - it is wrong SILENTLY: pnpm
						 * prints "No projects matched the filters" and exits 0, so the endpoint
						 * reported ok, the toast said "Palette applied", every tab reloaded, and
						 * not one byte was written. An apply that cannot work must fail loudly,
						 * and this one could not fail at all.
						 *
						 * `npx tsx` runs the same script the `generate:palettes` npm script does,
						 * so what the button does and what a terminal does stay identical - which
						 * was the whole point of routing both through one command.
						 */
						const { stdout } = await run("npx", ["tsx", "scripts/generate-palettes.ts", ...argv], {
							cwd: server.config.root,
							// Windows resolves `npx` through a .cmd shim, which execFile will
							// not run without this. The array form still applies, so no
							// argument is ever concatenated into a command string.
							shell: process.platform === "win32",
						});
						/*
						 * RELOAD EVERY CONNECTED CLIENT, not just the tab that pressed the
						 * button.
						 *
						 * `data-palette` is written onto <html> during SSR from a build-time
						 * constant, so it is fixed for the life of a page load. Editing
						 * theme.config.ts triggers an HMR module update, and an HMR update
						 * does not re-run the document render - the attribute stays whatever
						 * it was when that tab loaded.
						 *
						 * The visible symptom is two tabs on the same dev server showing two
						 * different themes, which reads as a per-route theming bug and is
						 * nothing of the kind: /assets loaded under one palette and
						 * /components/table under another, and neither noticed the file move
						 * between them. It was survivable while committing a theme meant
						 * going to a terminal; with a button on the page it would happen
						 * every time somebody pressed it.
						 */
						server.hot.send({ path: "*", type: "full-reload" });
						send(200, { ok: true, output: stdout });
					} catch (error) {
						const failure = error as { stderr?: string; stdout?: string; message?: string };
						send(422, {
							error: failure.message ?? "the generator failed",
							ok: false,
							// stdout first: the generator prints WHICH pairing failed there and
							// only the exit status on stderr.
							output: `${failure.stdout ?? ""}${failure.stderr ?? ""}`.trim(),
						});
					}
				});
			});
		},
		name: "apply-theme",
	};
}
