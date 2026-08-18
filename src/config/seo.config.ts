// SEO & metadata config — update this file to manage all app-level meta.
// Per-route titles are composed as: `${page} | ${APP_NAME}`

import { env } from "@/env";

// ---- Site identity — change these when customising the template ----
export const APP_NAME = "IPMS";
export const APP_DESCRIPTION =
	"The Infrastructure Development Office of the Technological University of the Philippines - online engineering request, tracking and document management.";
// -------------------------------------------------------------------

export const seo = {
	name: APP_NAME,
	description: APP_DESCRIPTION,

	// Base URL — used for canonical links and OG URLs
	url: env.VITE_BASE_URL,

	// Default OG image — place file in /public/og-image.png
	ogImage: "/og-image.png",

	// Twitter / X card
	twitter: {
		card: "summary_large_image" as const,
		site: "@tanstack",
		creator: "@tanstack",
	},

	// Usage: seo.title('Dashboard') → 'Dashboard | My App'
	title: (page?: string) => (page ? `${page} | ${APP_NAME}` : APP_NAME),
} as const;
