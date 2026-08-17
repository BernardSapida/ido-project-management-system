import { AppButton, AppGlassCard, AppPageHeader, AppQueryError } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import { TRPCClientError } from "@trpc/client";
import type { ReactNode } from "react";
import { useState } from "react";
import { seo } from "@/config/seo.config";
import type { TRPCRouter } from "@/integrations/trpc/router";

/**
 * Query error lab. Developer reference under /components, which owns the
 * backdrop and the nav; every page there is noindex.
 *
 * It takes the raw `error`, not a message, and that is the whole component.
 * Every call site used to hand over `error instanceof Error ? error.message :
 * undefined`, which threw away the status code and left one headline covering a
 * 404, a 403, an expired session and a dropped wifi alike. Three of those four
 * have nothing to do with the server and none are fixed by a retry button.
 *
 * The first section is the argument: one switcher, six raw errors, and the copy
 * and the recovery both change without the caller writing a word.
 */
export const Route = createFileRoute("/(references)/components/query-error")({
	head: () => ({
		meta: [{ title: seo.title("Query error lab") }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: "Query error" },
	component: QueryErrorLabPage,
});

/* -------------------------------------------------------------------------- */

/**
 * A tRPC failure as it arrives at a component - the shape the link layer builds
 * from the wire response, not a hand-made Error with a message glued on. The
 * `data.code` is what `classifyError` reads; everything else here is what a real
 * one carries alongside it.
 */
function trpcError(code: string, message: string, requestId?: string) {
	return TRPCClientError.from<TRPCRouter>({
		error: {
			code: -32001,
			data: { code, httpStatus: 400, path: "orders.list", requestId },
			message,
		},
	});
}

interface Specimen {
	error: unknown;
	label: string;
	note: string;
}

const SPECIMENS: Specimen[] = [
	{
		error: trpcError("NOT_FOUND", "That order does not exist.", "req_8f21c0a9"),
		label: "404 not found",
		note: "The row is gone. Retrying fetches the same nothing, so the way out is elsewhere.",
	},
	{
		error: trpcError("FORBIDDEN", "Your role cannot read other teams' orders."),
		label: "403 forbidden",
		note: "The request worked. The answer was no. Nothing the user can press fixes this - only someone who can grant the role.",
	},
	{
		error: trpcError("UNAUTHORIZED", "UNAUTHORIZED"),
		label: "401 session expired",
		note: "Signing in again fixes it. Note the message is only the code back again, so it is dropped and the kind's own copy takes over.",
	},
	{
		error: trpcError("TOO_MANY_REQUESTS", "Slow down - try again in a minute.", "req_44b0d112"),
		label: "429 rate limited",
		note: "Waiting fixes it. Retrying immediately makes it worse.",
	},
	{
		error: trpcError("INTERNAL_SERVER_ERROR", "Something failed while building the report."),
		label: "500 server",
		note: "The one case where 'the server is broken' is honest, and where a retry is genuinely worth offering.",
	},
	{
		error: new TypeError("Failed to fetch"),
		label: "Network / offline",
		note: "fetch rejects with a TypeError when the request never left - DNS, CORS, dropped wifi. AppErrorState demotes it further to 'offline' if the browser says the device has no connection.",
	},
	{
		error: new Error("Report generation timed out after 30s."),
		label: "Unhandled",
		note: "Not a tRPC error and not a TypeError. It keeps its sentence and gets the generic kind, which is the honest answer rather than a guessed one.",
	},
];

function QueryErrorLabPage() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="The failure state for ONE query, standing in for the region that query feeds."
				title="Query error lab"
			/>
			<ScopeSection />
			<ClassificationSection />
			<RetrySection />
			<RegionSection />
		</div>
	);
}

/* -------------------------------------------------------------------------- */

function ClassificationSection() {
	const [index, setIndex] = useState(0);
	const specimen = SPECIMENS[index] ?? SPECIMENS[0];

	if (!specimen) return null;

	return (
		<LabSection
			description="Seven raw errors through one component. Switch between them and read the headline, the sentence and the button: all three come from the error itself. The caller passes `error` and nothing else."
			title="One prop, seven failures"
			usedIn={["Every query in the app - this is the classification, not a variant"]}
		>
			<div
				className="flex flex-wrap gap-2"
				data-cy="switcher"
			>
				{SPECIMENS.map((entry, entryIndex) => (
					<AppButton
						data-cy={`switch-${entry.label.split(" ")[0]?.toLowerCase()}`}
						key={entry.label}
						onPress={() => setIndex(entryIndex)}
						size="sm"
						variant={entryIndex === index ? "primary" : "secondary"}
					>
						{entry.label}
					</AppButton>
				))}
			</div>

			<p
				className="text-sm text-muted"
				data-cy="switcher-note"
			>
				{specimen.note}
			</p>

			<div className="rounded-2xl border border-border">
				<AppQueryError
					data-cy="classified"
					error={specimen.error}
					onRetry={() => undefined}
				/>
			</div>
		</LabSection>
	);
}

function RetrySection() {
	const [attempts, setAttempts] = useState(0);

	return (
		<LabSection
			description="`onRetry` is the query's own refetch. Without it the only way out of a failed region is a full page reload, which throws away every other query on the screen that succeeded."
			title="Retry"
			usedIn={["A 500 or a timeout - where trying again can genuinely work"]}
		>
			<div className="rounded-2xl border border-border">
				<AppQueryError
					data-cy="retryable"
					error={trpcError("INTERNAL_SERVER_ERROR", "The report service is not responding.")}
					onRetry={() => setAttempts((count) => count + 1)}
				/>
			</div>
			<p className="text-sm text-muted">
				Retries:{" "}
				<span
					className="font-medium"
					data-cy="retry-count"
				>
					{attempts}
				</span>
			</p>
			<div className="rounded-2xl border border-dashed border-border">
				<AppQueryError
					data-cy="not-retryable"
					error={trpcError("FORBIDDEN", "Your role cannot read this report.")}
				/>
			</div>
			<p className="text-sm text-muted">
				The second one has no `onRetry` at all - correctly, because retrying a 403 asks the same question and gets the
				same no. `AppErrorState` still has a way out; it is just not a retry.
			</p>
		</LabSection>
	);
}

/**
 * Where this component actually lives: a dashboard where one panel failed and
 * the rest did not. Everything below this section is reference.
 */
function ScopeSection() {
	const [isRecovered, setIsRecovered] = useState(false);

	return (
		<LabSection
			description="Three panels on one dashboard; the middle one's query failed. This component is always `variant='section'`, so it replaces the region that one query feeds and nothing else - the nav, the header and every other query that succeeded stay on screen and stay usable. Taking the whole page down to report one dead panel costs the user the two panels that were working. Press Try again and watch only the middle one change."
			title="One panel failed, the page did not"
			usedIn={["Dashboards", "Detail pages with independent panels", "Any screen with more than one query"]}
		>
			<div
				className="flex flex-col gap-3"
				data-cy="dashboard"
			>
				<div
					className="rounded-2xl border border-border bg-muted-surface/40 px-4 py-3 text-sm text-muted"
					data-cy="dashboard-ok-top"
				>
					Open orders — 128 this week. This panel loaded.
				</div>
				<div className="rounded-2xl border border-border">
					{isRecovered ? (
						<div
							className="px-4 py-3 text-sm text-muted"
							data-cy="dashboard-recovered"
						>
							Warehouse throughput — 4,210 units. Loaded on the second attempt.
						</div>
					) : (
						<AppQueryError
							data-cy="dashboard-error"
							error={trpcError("GATEWAY_TIMEOUT", "The upstream warehouse service timed out.", "req_c31a90f2")}
							onRetry={() => setIsRecovered(true)}
						/>
					)}
				</div>
				<div
					className="rounded-2xl border border-border bg-muted-surface/40 px-4 py-3 text-sm text-muted"
					data-cy="dashboard-ok-bottom"
				>
					Returns — 6 open. This panel loaded too.
				</div>
			</div>
			<AppButton
				data-cy="dashboard-break"
				isDisabled={!isRecovered}
				onPress={() => setIsRecovered(false)}
				size="sm"
				variant="secondary"
			>
				Break it again
			</AppButton>
		</LabSection>
	);
}

function RegionSection() {
	return (
		<LabSection
			description="A reference block appears only when the error carried one. It is there so a user who believes the link should have worked has something to quote at support - and so nobody has to ask them to describe the screen."
			title="Reference codes"
			usedIn={["Anything a user might have to quote at support"]}
		>
			<div className="grid gap-4 md:grid-cols-2">
				<div className="flex flex-col gap-2">
					<div className="rounded-2xl border border-border">
						<AppQueryError
							data-cy="with-reference"
							error={trpcError("CONFLICT", "This order was updated by someone else.", "req_7d0e4413")}
						/>
					</div>
					<span className="text-xs text-muted">with a request id</span>
				</div>
				<div className="flex flex-col gap-2">
					<div className="rounded-2xl border border-border">
						<AppQueryError
							data-cy="without-reference"
							error={trpcError("CONFLICT", "This order was updated by someone else.")}
						/>
					</div>
					<span className="text-xs text-muted">without one - the code alone</span>
				</div>
			</div>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

interface LabSectionProps {
	children: ReactNode;
	description: string;
	title: string;
	/** Where this shape is used on a real screen. A specimen with no stated
	 *  purpose is a screenshot. */
	usedIn?: string[];
}

function LabSection({ children, description, title, usedIn }: LabSectionProps) {
	return (
		<AppGlassCard>
			<AppGlassCard.Content className="space-y-4 p-4 sm:p-5">
				<div>
					<h2 className="text-lg font-semibold">{title}</h2>
					<p className="mt-1 text-sm text-muted">{description}</p>
					{usedIn ? (
						<ul className="mt-2 flex flex-wrap gap-1.5">
							{usedIn.map((use) => (
								<li
									className="rounded-full bg-muted-surface px-2.5 py-0.5 text-xs text-muted"
									key={use}
								>
									{use}
								</li>
							))}
						</ul>
					) : null}
				</div>
				{children}
			</AppGlassCard.Content>
		</AppGlassCard>
	);
}
