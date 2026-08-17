import { AppChip, AppGlassCard, AppPageHeader } from "@bernardsapida/web-ui";
import { Construction } from "lucide-react";

interface LabStubProps {
	/** What the lab will show. One or two sentences - the same line the index card carries. */
	description: string;
	/**
	 * The variants and states this lab still owes, lifted from the checklist.
	 * Optional: some components have nothing to say beyond their description,
	 * and an empty "Planned" heading over no rows reads as a section that
	 * failed to load.
	 */
	scope?: string[];
	title: string;
}

/**
 * A lab route with no specimen yet: the title, what the component is for, and
 * the variants it still owes.
 *
 * These exist so the labs nav can carry the whole component checklist rather
 * than only the parts already built - the nav is where a developer goes to find
 * out whether something exists, and a component missing from it reads as "not
 * planned" rather than "not built yet". The chip is the load-bearing part: a
 * page that looked like a finished lab but held nothing would be worse than no
 * page at all.
 *
 * Replacing one of these is the whole job - delete the `LabStub` call, build
 * the real sections, and drop `isStub` from the entry in `labs.registry.ts`.
 */
export function LabStub({ description, scope, title }: LabStubProps) {
	return (
		<div className="space-y-6">
			<AppPageHeader
				action={
					<AppChip
						icon={Construction}
						label="Not built yet"
						size="sm"
						tone="warning"
					/>
				}
				subtitle={description}
				title={title}
			/>

			{scope && scope.length > 0 ? (
				<AppGlassCard>
					<AppGlassCard.Content className="flex flex-col gap-3 p-5">
						<div>
							<h2 className="text-lg font-semibold text-text-primary">Planned</h2>
							<p className="mt-1 text-sm text-text-secondary">
								What this lab has to demonstrate before the checklist box can be ticked.
							</p>
						</div>
						<ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-text-secondary">
							{scope.map((item) => (
								<li key={item}>{item}</li>
							))}
						</ul>
					</AppGlassCard.Content>
				</AppGlassCard>
			) : null}
		</div>
	);
}
