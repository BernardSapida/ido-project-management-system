import { AppPageHeader } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/config/seo.config";
import { assertAuthenticatedRoleFn } from "@/features/auth/functions/auth.functions";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { RequestForm } from "@/features/request-form/components/RequestForm";
import type { Position } from "@/features/request-form/lib/request-options";
import { USER_ROLES } from "@/utils/config";

export const Route = createFileRoute("/_authenticated/requests/new")({
	/**
	 * Requestors only. Staff review requests, they do not file them.
	 *
	 * This gate ORGANISES; it does not protect. `request.create` checks the
	 * caller's position and their `CREATE_REQUEST` grant server-side, so somebody
	 * who deep-links past this reaches a form whose Save Draft answers FORBIDDEN.
	 */
	beforeLoad: async () => {
		return await assertAuthenticatedRoleFn({ data: { allowedRoles: [USER_ROLES.USER] } });
	},
	head: () => ({
		meta: [{ title: seo.title("New Request") }, { content: "noindex", name: "robots" }],
	}),
	staticData: {
		breadcrumb: "New Request",
	},
	component: RequestCreatePage,
});

function RequestCreatePage() {
	const { user } = useAuth();

	/*
	 * Both prefills are display values, and the server rewrites both from the
	 * session on the way in. They are shown because they are PRINTED - a requestor
	 * who cannot see which name and which representative row their request will
	 * carry finds out on the paper copy.
	 *
	 * `firstname`/`lastname` rather than `name`, to match what the server composes.
	 */
	const requestedBy = `${user?.firstname ?? ""} ${user?.lastname ?? ""}`.trim();

	return (
		<div className="flex flex-col gap-8">
			<AppPageHeader
				subtitle="Fill out every required field, then save it as a draft or submit it to IDO."
				title="New Request"
			/>

			<RequestForm
				defaultValues={{
					position: (user?.position as Position | null) ?? undefined,
					requestedBy: requestedBy || (user?.name ?? ""),
				}}
				mode="create"
			/>
		</div>
	);
}
