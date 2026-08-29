import { AppNotFound } from "@bernardsapida/web-ui";
import { AppThemeCustomizer } from "@bernardsapida/web-ui/theme-customizer";
import { createFileRoute } from "@tanstack/react-router";
import { GENERATED_PALETTES } from "@/config/theme/palettes.generated";
import { PALETTE_PRESETS } from "@/config/theme/presets";
import { THEME } from "@/config/theme.config";

/**
 * `/dev/theme` - the theme customizer as a standalone dev tool. Mounts
 * <AppThemeCustomizer/> from the package and posts onApply to the dev-only
 * /__apply-theme middleware in vite-plugin-apply-theme.ts. Guarded to dev.
 */
export const Route = createFileRoute("/dev/theme")({
	head: () => ({ meta: [{ content: "noindex", name: "robots" }, { title: "Theme" }] }),
	component: DevThemeRoute,
});

function DevThemeRoute() {
	if (import.meta.env.PROD) return <AppNotFound />;

	return (
		<div className="p-4">
			<AppThemeCustomizer
				current={THEME}
				data-cy="dev-theme-customizer"
				generatedPalettes={GENERATED_PALETTES}
				onApply={(flags) =>
					fetch("/__apply-theme", {
						body: JSON.stringify(flags),
						headers: { "content-type": "application/json" },
						method: "POST",
					}).then((response) => response.json())
				}
				presets={PALETTE_PRESETS}
			/>
		</div>
	);
}
