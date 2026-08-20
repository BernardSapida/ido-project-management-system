import netlify from "@netlify/vite-plugin-tanstack-start";
import { nitro } from "nitro/vite";
import { applyThemePlugin } from "./vite-plugin-apply-theme.ts";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const config = defineConfig({
	/*
	 * Native in vite 8 - replaces the vite-tsconfig-paths plugin, which ran a
	 * resolveId hook on every import in every module.
	 *
	 * The explicit alias beside it is for VITEST, which does not honour
	 * `tsconfigPaths` and so cannot load any module importing `@/...`. Same
	 * mapping as tsconfig's `paths`, so the two cannot disagree.
	 */
	resolve: {
		alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
		tsconfigPaths: true,
	},
	plugins: [
		applyThemePlugin(),
		devtools(),
		/*
		 * DO NOT pass `dev: { edgeFunctions: { enabled: false } }` here.
		 *
		 * It is tempting: emulating edge functions spawns a Deno process that leaks
		 * without bound - measured going 170MB -> 7GB in under an hour - and
		 * starving the machine produces failures that point everywhere except at
		 * this plugin (hydration missing Cypress's 60s gate, the dev server dying,
		 * Electron crashing with 3758096392, routes answering a bare `Cannot GET`
		 * 404).
		 *
		 * But turning it off BREAKS CLIENT HYDRATION. Tried and measured: the page
		 * still server-renders and answers in ~1s, React never attaches, and every
		 * spec fails with "React never attached within 60000ms" on a machine with
		 * 18GB free and no Deno running at all. The emulator's middleware is
		 * evidently serving something the client entry needs.
		 *
		 * The working mitigation is to RESTART THE DEV SERVER before a long Cypress
		 * run, not to disable the feature.
		 */
		/*
		 * The host adapter, chosen at BUILD time - never both.
		 *
		 * Each of these owns the server build: netlify() emits a Netlify function
		 * bundle, nitro() emits Vercel Functions via Nitro's vercel preset. Running
		 * the pair would have two plugins writing the same server output.
		 *
		 * Vercel sets VERCEL=1 in its build image, so the branch needs no config on
		 * either side: Netlify keeps building exactly as before, and a Vercel import
		 * of this repo picks up Nitro with no dashboard build-command override.
		 *
		 * Vercel ALSO needs NPM_RC set in the project's environment variables -
		 * @bernardsapida/web-ui comes from GitHub Packages, and Vercel's NPM_TOKEN
		 * only ever authenticates registry.npmjs.org, so a PAT put there installs
		 * nothing and the build dies on a 401. See .npmrc.ci for the same problem's
		 * Netlify-shaped answer.
		 *
		 * traceDeps ships react into the function's own node_modules so it stays a
		 * REAL external, resolved once by node.
		 *
		 * There are TWO rolldown builds here: vite's ssr build emits _ssr/*, and
		 * nitro's own build bundles node_modules into _libs/*. Bundling react into
		 * the first (resolve.noExternal) only moves the problem - @tanstack/react-router
		 * carries a second copy into _libs, react-dom sets the hook dispatcher on that
		 * one, AppUIProvider calls useMemo on the other, and every render 500s with
		 * "Cannot read properties of null (reading 'useMemo')". Leaving react external
		 * to both builds is the only arrangement where they share an instance.
		 */
		process.env.VERCEL
			? nitro({ traceDeps: ["react", "react-dom"] })
			: netlify(),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
	],
	optimizeDeps: {
		include: [
			// 'lucide-react',
			// '@tanstack/react-store',
			// 'react-hook-form',
			// '@hookform/resolvers',
			// 'uuid',
			// 'clsx',
			// '@internationalized/date',
			'moment',
			// "framer-motion"

			// Start's vite plugin marks the router devtools external, so the dep
			// scanner never pre-bundles them. Without these, opening the devtools
			// panel discovers @tanstack/router-devtools-core (Solid) mid-session
			// and forces a full re-optimise + page reload - ~9s against this dep
			// graph. Let vite follow the transitive imports; listing
			// router-devtools-core directly fails to resolve under pnpm.
			'@tanstack/react-router-devtools',
			'@tanstack/react-devtools',
			'@tanstack/react-query-devtools',

			// Start's plugin externalises the router too, so it was served as dozens
			// of individual raw modules from node_modules. Pre-bundling it cuts the
			// dev request count substantially.
			//
			// Do NOT add '@tanstack/react-start' here: it does not pre-bundle
			// cleanly, ending up BOTH raw and pre-bundled at once. Two copies of
			// Start's module state is exactly the failure the plugin's
			// externalisation exists to prevent.
			'@tanstack/react-router',
		]
	}
});

export default config;
