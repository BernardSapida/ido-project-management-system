import { useNavigate } from "@tanstack/react-router";
import { ChevronsUpDown, LogOut } from "lucide-react";
import { AppAvatar } from "../AppAvatar";
import { AppButton } from "../AppButton";
import type { DropdownSection } from "../AppDropdown";
import { AppDropdown } from "../AppDropdown";
import type { NavItem } from "../../lib/nav";
import { cn } from "../../lib/cn";

interface AppSidebarUserCardProps {
	"data-cy"?: string;
	/** On the icon rail the card becomes the avatar alone - still the same menu. */
	isCollapsed?: boolean;
	/**
	 * Account destinations - Profile, settings, whatever the role has. They go
	 * INSIDE the menu, above Sign out.
	 *
	 * They used to be a standing block of rows above this card, under an ACCOUNT
	 * heading, with sign-out as a separate icon button beside the avatar. That
	 * spent three permanent rows and a divider of a column whose job is the
	 * DESTINATIONS, on things reached a few times a month - and it put the one
	 * irreversible control in the nav permanently, a slip away from the profile
	 * link above it.
	 */
	menuItems?: NavItem[];
	onLogout: () => void;
	/**
	 * Called instead of navigating. The app leaves it unset - an account row goes
	 * to the account screen, which is the whole point of it. The labs set it so a
	 * specimen cannot navigate the page it is being read on out from under the
	 * reader.
	 */
	onSelect?: (item: NavItem) => void;
	user: { email: string; name: string };
}

/**
 * The footer row pinned below the sidebar nav, and the account menu behind it.
 *
 * The whole row is the trigger: avatar, name, email, and a chevron pair saying
 * it opens. Pressing it opens the account menu - the destinations, then Sign
 * out. Name and email each truncate to one line so a long address cannot widen
 * the 260px sidebar and break the shell grid.
 *
 * ## Why the menu, rather than rows in the column
 *
 * The account block used to stand in the nav: an ACCOUNT heading, a Profile row
 * under it, and a sign-out button parked beside the avatar. Three problems, and
 * the third is the one that matters.
 *
 * 1. It spent permanent vertical space in a column whose job is the
 *    destinations, on things reached a few times a month.
 * 2. On the rail it became a second run of unlabelled glyphs below the first,
 *    which is where a rail stops being scannable.
 * 3. **Sign out sat one slip away from Profile, permanently on screen.** Ending
 *    a session is the one irreversible thing a nav can do, and it does not
 *    belong in the nav's own tab order next to a link. Inside a menu it costs a
 *    deliberate open, which is the right price.
 *
 * A rule above the card, not a box around it. The card's own border inside the
 * sidebar's border was two frames a few pixels apart, and it made the identity
 * read as a widget parked in the nav rather than as the foot of it.
 *
 * Collapsed, the identity block goes rather than shrinking - a 72px rail can
 * hold an avatar or a truncated name, and the avatar is the one that still
 * means something. The name is not lost: it heads the menu, which is now the
 * only thing the avatar does.
 */
export function AppSidebarUserCard({
	"data-cy": dataCy,
	isCollapsed = false,
	menuItems = [],
	onLogout,
	onSelect,
	user,
}: AppSidebarUserCardProps) {
	const navigate = useNavigate();

	const go = (item: NavItem) => {
		if (onSelect) {
			onSelect(item);
			return;
		}
		navigate({ to: item.href });
	};

	/*
	 * One section, and `isDestructive` does the placing. AppDropdown hoists a
	 * destructive item into a final group behind a separator wherever it was
	 * declared, so Sign out cannot be reached by a slip from the row above it -
	 * and marking it is also what colours the glyph and the label red.
	 *
	 * Red for a session ending is a deliberate stretch of what that colour means
	 * here: nothing is deleted, and the menu's own convention is that red says
	 * "cannot be undone". It is the loudest thing in a short menu, which is the
	 * point - this is the one row in the nav a mis-click actually costs you.
	 */
	const sections: DropdownSection[] = [
		{
			items: [
				...menuItems.map((item) => ({
					icon: item.icon,
					key: item.href,
					label: item.title,
					onAction: () => go(item),
				})),
				{ icon: LogOut, isDestructive: true, key: "logout", label: "Sign out", onAction: onLogout },
			],
			key: "account",
			/*
			 * On the rail this is the ONLY place the name appears, so the menu
			 * carries it. Expanded it is already two lines away on the trigger, and a
			 * heading repeating it is chrome.
			 */
			label: isCollapsed ? user.name : undefined,
		},
	];

	return (
		<div
			className={cn(
				"mt-4 shrink-0 border-t border-border pt-4",
				// No rule on the rail: at 72px the identity is a single avatar, and a
				// full-width line above it separates a column from itself.
				isCollapsed && "mt-3 flex w-full flex-col items-center border-t-0 pt-0",
			)}
			data-collapsed={isCollapsed}
			data-cy={dataCy}
		>
			<AppDropdown
				data-cy={dataCy ? `${dataCy}-menu` : undefined}
				label="Account"
				sections={sections}
				trigger={
					<AppButton
						// The trigger's own name, which is never the menu's. Icon-only on
						// the rail there is nothing else to read it from.
						aria-label={`Account menu for ${user.name}`}
						className={cn(
							"h-auto shrink-0",
							isCollapsed
								? "size-11 justify-center rounded-full p-0"
								: "w-full justify-start gap-3 rounded-xl px-2 py-2",
						)}
						data-cy={dataCy ? `${dataCy}-trigger` : undefined}
						variant="ghost"
					>
						<AppAvatar
							name={user.name}
							size="md"
						/>
						{isCollapsed ? null : (
							<>
								{/*
								 * Explicit text colours, not inherited ones. This row renders in
								 * two places - the glass sidebar and the opaque drawer - and
								 * Drawer.Body sets its own muted colour that washed the name out.
								 * The button's own ghost colour would do the same.
								 */}
								<span className="min-w-0 flex-1 text-left">
									<span
										className="block truncate text-sm font-semibold text-foreground"
										data-cy={dataCy ? `${dataCy}-name` : undefined}
									>
										{user.name}
									</span>
									<span
										className="block truncate text-xs font-normal text-muted-foreground"
										data-cy={dataCy ? `${dataCy}-email` : undefined}
									>
										{user.email}
									</span>
								</span>
								<ChevronsUpDown
									aria-hidden="true"
									className="size-4 shrink-0 text-muted"
								/>
							</>
						)}
					</AppButton>
				}
			/>
		</div>
	);
}
