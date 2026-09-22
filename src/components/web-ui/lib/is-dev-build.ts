/**
 * Whether this is a development build, for a package that cannot assume it was
 * bundled.
 *
 * `import.meta.env.DEV` is a Vite-ism the bundler *substitutes*, and everything
 * here used to read it directly. That works in this repo - `apps/web` compiles
 * these files from source - and it works in a child's browser bundle. It does
 * not survive the one path nobody tests locally: a child's SSR render, where
 * Vite externalises `node_modules` by default, Node loads `dist/index.js`
 * itself, and `import.meta` carries nothing but `url`. Reading `.DEV` off that
 * `undefined` crashed every server render that reached an `AppErrorState`
 * (`TypeError: Cannot read properties of undefined (reading 'DEV')`), which is
 * to say: every server render that had already gone wrong.
 *
 * So read the flag defensively, and fall back to `NODE_ENV` for the runtimes
 * that have one. **When neither can answer, the answer is `false`** - every
 * caller uses this to turn on a warning aimed at whoever is building the app,
 * and a warning that guesses wrong in the "on" direction is shown to their
 * users instead.
 */
function resolveIsDevBuild(): boolean {
	/*
	 * Read `import.meta.env` as a whole rather than reaching straight for `.DEV`:
	 * Vite defines the object, so this still folds to a literal wherever it is
	 * bundled, and it is merely `undefined` wherever it is not.
	 */
	const viteEnv = (import.meta as ImportMeta).env;
	if (typeof viteEnv?.DEV === "boolean") return viteEnv.DEV;

	/*
	 * Off `globalThis` rather than as a bare `process`, because in a browser
	 * bundle that no bundler shimmed, the bare identifier is a ReferenceError -
	 * the same class of crash this function exists to stop.
	 */
	const nodeEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
		?.NODE_ENV;

	return nodeEnv === "development";
}

/** `true` only when something could actually confirm it. See `resolveIsDevBuild`. */
export const IS_DEV_BUILD: boolean = resolveIsDevBuild();
