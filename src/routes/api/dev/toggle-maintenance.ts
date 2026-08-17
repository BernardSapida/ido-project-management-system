import { createFileRoute } from "@tanstack/react-router";
import { env } from "@/env";

// In-memory toggle — resets on server restart. For real maintenance, set MAINTENANCE_MODE env var.
let maintenanceOverride: boolean | null = null;

export function getMaintenanceMode(): boolean {
	if (maintenanceOverride !== null) return maintenanceOverride;
	return env.MAINTENANCE_MODE === "true";
}

export const Route = createFileRoute("/api/dev/toggle-maintenance")({
	server: {
		handlers: {
			POST: () => {
				if (env.NODE_ENV !== "development") {
					return new Response("Not found", { status: 404 });
				}

				maintenanceOverride = !getMaintenanceMode();

				return new Response(JSON.stringify({ maintenanceMode: maintenanceOverride }), {
					headers: { "Content-Type": "application/json" },
				});
			},
		},
	},
});
