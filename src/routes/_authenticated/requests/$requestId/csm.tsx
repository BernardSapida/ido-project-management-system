import { AppPageHeader, AppQueryError } from "@bernardsapida/web-ui";
import { Skeleton } from "@heroui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { seo } from "@/config/seo.config";
import { assertAuthenticatedFn } from "@/features/auth/functions/auth.functions";
import { CsmCompletedState } from "@/features/csm/components/CsmCompletedState";
import { CsmForm } from "@/features/csm/components/CsmForm";
import { useMyCsm } from "@/features/csm/hooks/use-user-csm-queries";

export const Route = createFileRoute("/_authenticated/requests/$requestId/csm")({
	/**
	 * Signed in, and that is all the route can say.
	 *
	 * Not role-gated, deliberately, and for the opposite reason to the review
	 * pages: the question here is not what the reader IS but whose request this
	 * is. A staff member files requests of their own and must be able to answer
	 * for them, and a `USER` list would let every other requestor through to a
	 * page about somebody else's request. `getMyCsm` answers that per request -
	 * `null` for anyone but the owner - and `submitCsm` re-checks it on the write.
	 */
	beforeLoad: async () => {
		return await assertAuthenticatedFn();
	},
	head: () => ({
		meta: [{ title: seo.title("Satisfaction Feedback") }, { content: "noindex", name: "robots" }],
	}),
	staticData: {
		breadcrumb: "Feedback",
		/* `prose`, and it is the narrowest measure any page in this app asks for.
		   There are two questions here and the whole screen is one column of them;
		   at `wide` the stars and the comment box would sit in a field of empty
		   space with nothing to line up against. */
		mainWidth: "prose",
	},
	component: CsmPage,
});

function CsmPage() {
	const { requestId } = Route.useParams();
	const navigate = useNavigate();
	const { data: csm, error, isError, isPending, refetch } = useMyCsm(requestId);

	const goToRequest = () => void navigate({ params: { requestId }, to: "/requests/$requestId" });

	/*
	 * The silent redirect, and both cases it covers.
	 *
	 * `null` means either that the request was never finally approved - so no
	 * `Csm` row exists - or that it is not the caller's request. The procedure
	 * refuses to tell the two apart on purpose, and the page does not need it to:
	 * landing back on the request IS the answer. `replace` so the browser's Back
	 * button does not bounce the requestor straight into the redirect again.
	 *
	 * No toast. Nothing failed, and an error the person cannot act on - they did
	 * not choose to come here, the URL did - is noise on top of a page they never
	 * asked to see.
	 */
	useEffect(() => {
		if (!isPending && !isError && csm === null) {
			void navigate({ params: { requestId }, replace: true, to: "/requests/$requestId" });
		}
	}, [csm, isError, isPending, navigate, requestId]);

	/* The PDF opens in a NEW TAB: it is a document to keep beside the request
	   rather than a page to travel to, and a router navigation would lose this one
	   behind it. A plain URL rather than a typed `to` for that reason and no
	   other - the route exists now (spec 016), but `router.navigate` has no way to
	   open one in a second tab. */
	const openPdf = () => window.open(`/requests/${requestId}/pdf`, "_blank", "noopener,noreferrer");

	return (
		<div className="flex flex-col gap-8">
			<AppPageHeader
				subtitle="Tell us how your request was handled. This completes the request."
				title="Satisfaction Feedback"
			/>

			<CsmBody
				csm={csm}
				error={error}
				isError={isError}
				isPending={isPending}
				onBackToRequest={goToRequest}
				onRetry={() => void refetch()}
				onViewPdf={openPdf}
				requestId={requestId}
			/>
		</div>
	);
}

interface CsmBodyProps {
	csm: ReturnType<typeof useMyCsm>["data"];
	error: unknown;
	isError: boolean;
	isPending: boolean;
	onBackToRequest: () => void;
	onRetry: () => void;
	onViewPdf: () => void;
	requestId: string;
}

/**
 * The four things below the header, in the order they can happen.
 *
 * Split out so the header renders identically in every one of them: the page
 * title is true while the record is loading, while it is redirecting, and after
 * the feedback has been given, and a component that returned early would make it
 * appear and disappear underneath the breadcrumb.
 */
function CsmBody({ csm, error, isError, isPending, onBackToRequest, onRetry, onViewPdf, requestId }: CsmBodyProps) {
	if (isPending) {
		return (
			<div
				className="flex flex-col gap-6"
				data-cy="csm-skeleton"
			>
				<Skeleton className="h-64 w-full rounded-lg" />
				<Skeleton className="h-12 w-full rounded-lg" />
			</div>
		);
	}

	/*
	 * A genuine failure - the network, or a session that expired between the
	 * route's own check and this query. NOT the "you may not see this" case: that
	 * one comes back as `null` and is handled by the redirect above, which is why
	 * there is no FORBIDDEN branch to write here.
	 */
	if (isError) {
		return (
			<AppQueryError
				data-cy="csm-error"
				error={error}
				onRetry={onRetry}
			/>
		);
	}

	// The redirect is in flight. Rendering the form for the frame it takes would
	// show a requestor a satisfaction form for a request that has none.
	if (!csm) return null;

	if (csm.submittedAt) {
		return (
			<CsmCompletedState
				comment={csm.comment}
				onBackToRequest={onBackToRequest}
				onViewPdf={onViewPdf}
				rating={csm.rating}
				submittedAt={csm.submittedAt}
			/>
		);
	}

	return (
		<CsmForm
			canSubmit={csm.canSubmit}
			// Straight back to the request, where the chip now reads Completed and
			// the banner that sent them here is gone. The toast is the thank-you; the
			// completed state is what they get if they ever come back to this URL.
			onSuccess={onBackToRequest}
			requestId={requestId}
		/>
	);
}
