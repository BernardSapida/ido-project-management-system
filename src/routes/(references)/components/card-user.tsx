import { AppPageHeader, AppToast } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { CardUser } from "@/components/project";
import { seo } from "@/config/seo.config";
import { LabSection, SpecimenLabel } from "@/features/labs/components/LabSection";

const TITLE = "Card user";

/**
 * Card user lab. A PROJECT COMPONENT - see the `Project Components` group in
 * labs.registry.ts.
 *
 * It is this project's own file, in `components/project/`, so unlike every
 * other lab on this site the component behind this page is one you may edit
 * directly. Nothing upstream will overwrite it and `pnpm up` cannot touch it.
 *
 * What the page is for: the component is a trigger and a menu, and neither of
 * its interesting states is a screenshot. Three things to check by hand.
 *
 * 1. **Press it.** The whole card is the trigger, not the chevron - a menu that
 *    only opens from a 16px glyph is one a thumb misses. Then press Escape, and
 *    click outside: both close it, and focus comes back to the card.
 * 2. **The long specimen.** Name and email both truncate rather than wrapping
 *    or pushing the chevron off the end. A sidebar foot is a fixed width and
 *    addresses are not.
 * 3. **Tab to it.** It takes focus as one stop and shows a visible ring. The
 *    avatar inside is a picture, never a second stop.
 */
export const Route = createFileRoute("/(references)/components/card-user")({
	head: () => ({
		meta: [{ title: seo.title(TITLE) }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: TITLE },
	component: CardUserLab,
});

function CardUserLab() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="The signed-in account, as the thing you press to sign out. This project's own component."
				title={TITLE}
			/>
			<DefaultSection />
			<OverflowSection />
			<InitialSection />
		</div>
	);
}

/* ── 1. The default ───────────────────────────────────────────────────────── */

/**
 * Constrained to the width it actually gets.
 *
 * The component is built for a sidebar foot and its inner column is a fixed
 * `w-30`, so a specimen given the full page width would prove nothing about the
 * only layout it ships in - and would hide the truncation the section below is
 * about.
 */
function DefaultSection() {
	return (
		<LabSection
			description="One row: monogram, name over email, and the chevron that says the row opens something. Pressing anywhere on the card opens the menu - the chevron is a sign, not the target."
			title="Default"
		>
			<div className="max-w-72">
				<CardUser
					onLogout={() =>
						AppToast.success("Signed out", {
							description: "The lab handles the press - no session was touched.",
							icon: LogOut,
						})
					}
					user={{ email: "ada@example.com", name: "Ada Lovelace" }}
				/>
			</div>
		</LabSection>
	);
}

/* ── 2. Names that do not fit ─────────────────────────────────────────────── */

function OverflowSection() {
	return (
		<LabSection
			description="Both lines truncate. A sidebar foot has one width and an email address has no upper bound, so the alternative to an ellipsis is a card that grows a third line or shoves the chevron out of reach."
			title="When the name does not fit"
		>
			<div className="flex max-w-72 flex-col gap-4">
				<div>
					<SpecimenLabel
						summary="Both lines clipped at the same edge."
						title="Long name and long address"
					/>
					<div className="mt-2">
						<CardUser
							onLogout={() => undefined}
							user={{
								email: "katherine.johnson@research.longdomainexample.co.uk",
								name: "Katherine Coleman Goble Johnson",
							}}
						/>
					</div>
				</div>
			</div>
		</LabSection>
	);
}

/* ── 3. The monogram ──────────────────────────────────────────────────────── */

/**
 * The empty-name case is here because it is the one that breaks silently.
 *
 * `user.name?.charAt(0)` on an empty string is an empty string, so the fallback
 * renders an empty circle rather than a letter - a real state for an account
 * created from an email invite that was never completed. The specimen exists so
 * the decision is visible rather than discovered in production.
 */
function InitialSection() {
	return (
		<LabSection
			description="The monogram is the first character of the name, on the brand tint. There is no photograph in this component at all - the account row is a name and an address, and a face would be one more thing to load in the corner nobody is looking at."
			title="The monogram"
		>
			<div className="flex max-w-72 flex-col gap-4">
				<CardUser
					onLogout={() => undefined}
					user={{ email: "grace@example.com", name: "grace hopper" }}
				/>
				<div>
					<SpecimenLabel
						summary="No name at all. The circle is empty - worth deciding on before an invite-only signup finds it for you."
						title="Nothing to take an initial from"
					/>
					<div className="mt-2">
						<CardUser
							onLogout={() => undefined}
							user={{ email: "no.name@example.com", name: "" }}
						/>
					</div>
				</div>
			</div>
		</LabSection>
	);
}
