import type { Position } from "@/features/request-form/lib/request-options";
import type { RequestFormValues } from "@/features/request-form/validations/schema/request.schema";
import type { User } from "@/types/auth.types";

/**
 * The two form fields that belong to the PROFILE rather than to the request.
 *
 * Neither is typed on the request form any more - both are read-only there (see
 * `RequestForm`) - so the value shown has to come from the same place the label
 * under it points at, which is the profile. One function because the create page
 * and the edit page both need it and the composition is not obvious: it is
 * `firstname`/`lastname` and NOT `name`, because those are the two the printed
 * form is laid out for and the server composes `requestedBy` from exactly those
 * on every save (see `request.create` and `request.saveDraft`). Composing it
 * differently here would show the requestor one name and print another.
 *
 * A key it has no value for is OMITTED rather than set to `undefined`, because
 * the callers SPREAD this over a saved request and a spread copies an explicit
 * `undefined` straight over the value underneath it. An account with no position
 * - which is every staff account - would otherwise blank the position of a draft
 * it is only displaying.
 */
export function requestorIdentity(user: User | null): Partial<RequestFormValues> {
	const identity: Partial<RequestFormValues> = {};
	const requestedBy = `${user?.firstname ?? ""} ${user?.lastname ?? ""}`.trim() || (user?.name ?? "");

	if (requestedBy) identity.requestedBy = requestedBy;
	if (user?.position) identity.position = user.position as Position;

	return identity;
}
