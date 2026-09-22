/**
 * `import.meta.env` without a dependency on Vite's types.
 *
 * Only the two build-time flags the components actually read. Pulling in
 * `vite/client` would make Vite a dependency of a package that has no business
 * caring which bundler a consumer uses - and would drag its whole ambient surface
 * (asset module declarations, `?url` imports) in with it.
 *
 * `env` is OPTIONAL, and that is the point of the type. This package ships built
 * ESM, and a consumer's SSR loads it through Node rather than through Vite,
 * where `import.meta` has a `url` and nothing else. Typing `env` as always
 * present let `import.meta.env.DEV` compile into `dist` and crash there. Nothing
 * should read this directly - use `IS_DEV_BUILD` from `lib/is-dev-build`.
 */
interface ImportMetaEnv {
	readonly DEV: boolean;
	readonly PROD: boolean;
}

interface ImportMeta {
	readonly env?: ImportMetaEnv;
}
