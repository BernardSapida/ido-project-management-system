import { AppButton, AppPageHeader, AppQueryError } from "@bernardsapida/web-ui";
import { Skeleton } from "@heroui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Undo2 } from "lucide-react";
import { seo } from "@/config/seo.config";
import { AdminCsmRecord } from "@/features/admin-csm/components/AdminCsmRecord";
import { useAdminCsmRecord } from "@/features/admin-csm/hooks/use-admin-csm-queries";

export const Route = createFileRoute("/_authenticated/admin/csm/$csmId")({
	/*
	 * No `beforeLoad` here either - `_authenticated/admin.tsx` gates the whole
	 * folder, and `adminCsm.getById` is an `adminProcedure` regardless of how
	 * anybody reached this URL.
	 */
	head: () => ({
		meta: [{ title: seo.title("Satisfaction Record") }, { content: "noindex", name: "robots" }],
	}),
	staticData: {
		breadcrumb: "Record",
	},
	component: AdminCsmRecordPage,
});

function AdminCsmRecordPage() {
	const { csmId } = Route.useParams();
	const navigate = useNavigate();
	const { data: record, error, isError, isPending, refetch } = useAdminCsmRecord(csmId);

	/*
	 * Back to the report, and deliberately NOT `history.back()`.
	 *
	 * A reader who arrived here from a link, a bookmark or a reload has no history
	 * to go back through, and a button that does nothing on those three paths is
	 * worse than one that always goes somewhere useful. What it costs is the
	 * filters they had - which is why the table's filters live in the URL and the
	 * browser's own Back button restores them exactly.
	 *
	 * The `search` is not decoration either: `page` and `pageSize` are required in
	 * the report's own search schema, so a typed navigation has to name them. The
	 * first page unfiltered is the honest default for a button that says "back to
	 * the report" rather than "back to where you were".
	 */
	const goToReport = () => void navigate({ search: { page: 1, pageSize: 10 }, to: "/admin/csm" });

	return (
		<div className="flex flex-col gap-8">
			{/*
			 * Above the title, and outside the three states below - the way out of a
			 * screen cannot depend on the screen having loaded. It used to be the last
			 * thing in the record card, so a failed fetch rendered an error and no
			 * control at all, and a reader who arrived by link had nothing to press.
			 *
			 * `-mb-4` against the column's `gap-8`: this reads as part of the title
			 * block, not as a section of its own standing a full gap away from it.
			 */}
			<div className="-mb-4">
				<AppButton
					data-cy="admin-csm-record-back"
					icon={Undo2}
					onPress={goToReport}
					size="sm"
					variant="tertiary"
				>
					Back to the report
				</AppButton>
			</div>

			<AppPageHeader
				subtitle="One requestor's answer, and the request it was recorded against."
				title="Satisfaction Record"
			/>

			{/* The header renders identically in all three states below it, which is
			    why the body is a separate branch and not an early return. */}
			{isPending ? (
				<Skeleton
					className="h-96 w-full rounded-lg"
					data-cy="admin-csm-record-skeleton"
				/>
			) : isError ? (
				/* NOT_FOUND on a record that has been removed, and anything else the
				   network does. `AppQueryError` classifies them apart - only one of
				   them is worth pressing Retry over. */
				<AppQueryError
					data-cy="admin-csm-record-error"
					error={error}
					onRetry={() => void refetch()}
				/>
			) : (
				<AdminCsmRecord record={record} />
			)}
		</div>
	);
}
