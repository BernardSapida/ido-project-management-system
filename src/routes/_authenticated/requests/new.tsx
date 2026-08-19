import { AppPageHeader } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/config/seo.config";
import { assertAuthenticatedRoleFn } from "@/features/auth/functions/auth.functions";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { RequestForm } from "@/features/request-form/components/RequestForm";
import { requestorIdentity } from "@/features/request-form/lib/requestor-identity";
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
	 * Not prefills any more - both fields are read-only on the form, so this IS
	 * their value. They are shown because they are PRINTED: a requestor who cannot
	 * see which name and which representative row their request will carry finds
	 * out on the paper copy. See `requestorIdentity` for why the name is composed
	 * from `firstname`/`lastname`.
	 */
	const identity = requestorIdentity(user);

	return (
		<div className="flex flex-col gap-8">
			<AppPageHeader
				subtitle="Fill out every required field, then save it as a draft or submit it to IDO."
				title="New Request"
			/>

			<RequestForm
				defaultValues={identity}
				mode="create"
			/>
		</div>
	);
}
