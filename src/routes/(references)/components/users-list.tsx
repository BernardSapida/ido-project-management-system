import type { EmptyReason, UserListItem } from "@bernardsapida/web-ui";
import { AppButton, AppGlassCard, AppPageHeader, AppToast, AppUserList } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { seo } from "@/config/seo.config";

/**
 * Users list lab. Developer reference under /components, which owns the
 * backdrop and the nav; every page there is noindex.
 *
 * The list is a roster, not a table - the thing to check here is that a person
 * stays identifiable as the row gets narrower: the presence chip drops under
 * the identity block rather than shrinking, and the email never disappears,
 * because it is the only thing separating the two Dela Cruzes below.
 */
export const Route = createFileRoute("/(references)/components/users-list")({
	head: () => ({
		meta: [{ title: seo.title("Users list lab") }, { content: "noindex", name: "robots" }],
	}),
	component: UsersListLabPage,
});

function UsersListLabPage() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="A roster of people. One row, one person, one action - not a table wearing avatars."
				title="Users list lab"
			/>
			<RosterSection />
			<StatesSection />
			<ContentSection />
		</div>
	);
}

/* -------------------------------------------------------------------------- */

interface LabSectionProps {
	children: ReactNode;
	description: string;
	title: string;
}

function LabSection({ children, description, title }: LabSectionProps) {
	return (
		<AppGlassCard>
			<AppGlassCard.Content className="space-y-4 p-4 sm:p-5">
				<div>
					<h2 className="text-lg font-semibold">{title}</h2>
					<p className="mt-1 text-sm text-muted">{description}</p>
				</div>
				{children}
			</AppGlassCard.Content>
		</AppGlassCard>
	);
}

/* -------------------------------------------------------------------------- */

const TEAM: UserListItem[] = [
	{
		email: "emma.wilson@example.com",
		key: "emma",
		name: "Emma Wilson",
		presence: "online",
		role: "Product Designer",
	},
	{
		email: "daniel.carter@example.com",
		key: "daniel",
		lastSeen: "3h ago",
		name: "Daniel Carter",
		presence: "offline",
		role: "Frontend Developer",
	},
	{
		email: "sophia.anderson@example.com",
		key: "sophia",
		name: "Sophia Anderson",
		presence: "online",
		role: "UX Researcher",
	},
	{
		email: "noah.reyes@example.com",
		key: "noah",
		lastSeen: "20 minutes ago",
		name: "Noah Reyes",
		presence: "away",
		role: "Warehouse Staff",
	},
];

/** The default: four people, every presence state, rows that go somewhere. */
function RosterSection() {
	return (
		<LabSection
			description="Every presence state at once. Online and offline are the same solid dot in two colours, so the words carry it - and anyone not online shows a last-seen time instead of the word 'Offline', because 'will they see this in ten minutes' is the question actually being asked. Narrow the window: the chip wraps under the email rather than being crushed."
			title="The roster"
		>
			<AppUserList
				data-cy="roster"
				label="Team members"
				onSelectUser={(user) =>
					AppToast.info(user.name, {
						description: `Opening the profile for ${user.email}.`,
						icon: UserPlus,
					})
				}
				users={TEAM}
			/>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

const EMPTY_COPY: Record<EmptyReason, string> = {
	filtered: "Filters hid everyone",
	"no-data": "Nobody added yet",
	"no-results": "Search found nobody",
};

type ListState = "empty-filtered" | "empty-no-data" | "empty-no-results" | "loaded" | "loading";

/** Everything other than the happy path, which is where lists usually ship broken. */
function StatesSection() {
	const [state, setState] = useState<ListState>("loading");

	return (
		<LabSection
			description="Four states, and the three empty ones are not interchangeable: a user whose filters hid everyone must not be told the system has nobody. The skeleton is three rows at the real height - avatar, two lines, chip - so nothing jumps when the data lands."
			title="Loading and empty"
		>
			<div className="space-y-4">
				<div className="flex flex-wrap gap-2">
					<StateButton
						current={state}
						label="Loading"
						onSelect={setState}
						value="loading"
					/>
					<StateButton
						current={state}
						label="Loaded"
						onSelect={setState}
						value="loaded"
					/>
					<StateButton
						current={state}
						label="No data"
						onSelect={setState}
						value="empty-no-data"
					/>
					<StateButton
						current={state}
						label="No results"
						onSelect={setState}
						value="empty-no-results"
					/>
					<StateButton
						current={state}
						label="Filtered out"
						onSelect={setState}
						value="empty-filtered"
					/>
				</div>

				<AppUserList
					data-cy="states"
					empty={{
						action: {
							label: state === "empty-no-data" ? "Invite someone" : "Clear filters",
							onPress: () =>
								AppToast.success(EMPTY_COPY[emptyReason(state)], {
									description: "The lab does not actually change anything.",
									icon: UserPlus,
								}),
						},
						query: state === "empty-no-results" ? "delacruz" : undefined,
						reason: emptyReason(state),
					}}
					isLoading={state === "loading"}
					label="Team members"
					onSelectUser={(user) =>
						AppToast.info(user.name, {
							description: user.email,
							icon: UserPlus,
						})
					}
					users={state === "loaded" ? TEAM : []}
				/>
			</div>
		</LabSection>
	);
}

function emptyReason(state: ListState): EmptyReason {
	if (state === "empty-no-results") return "no-results";
	if (state === "empty-filtered") return "filtered";
	return "no-data";
}

function StateButton({
	current,
	label,
	onSelect,
	value,
}: {
	current: ListState;
	label: string;
	onSelect: (state: ListState) => void;
	value: ListState;
}) {
	return (
		<AppButton
			data-cy={`state-${value}`}
			onPress={() => onSelect(value)}
			size="sm"
			variant={current === value ? "primary" : "secondary"}
		>
			{label}
		</AppButton>
	);
}

/* -------------------------------------------------------------------------- */

const AWKWARD: UserListItem[] = [
	{
		email: "maria.dela.cruz@quezoncitynorthdepot.example.com",
		key: "maria-1",
		name: "Maria Dela Cruz",
		presence: "online",
		role: "Regional Logistics Coordinator, Night Desk",
	},
	{
		avatarSrc: "/assets/does-not-exist.png",
		email: "m.delacruz@example.com",
		key: "maria-2",
		lastSeen: "6 days ago",
		name: "Maria Dela Cruz",
		presence: "offline",
		role: "Volunteer",
	},
	{
		email: "j@example.com",
		key: "jo",
		name: "Jo",
		presence: "away",
		role: "Admin",
	},
];

/** The content that breaks a row, and the read-only variant. */
function ContentSection() {
	return (
		<LabSection
			description="Two people with the same name, a role long enough to wrap, an email long enough to truncate, and a photo that 404s so the initials have to take over. The second list has no onSelectUser: no chevron, no button, no hover - a row that does not lead anywhere must not look like it does."
			title="Long content, and rows that go nowhere"
		>
			<div className="space-y-4">
				<AppUserList
					data-cy="awkward"
					label="People with awkward names"
					onSelectUser={(user) =>
						AppToast.info(user.name, {
							description: user.email,
							icon: UserPlus,
						})
					}
					users={AWKWARD}
				/>
				<AppUserList
					data-cy="read-only"
					label="People, read only"
					users={TEAM.slice(0, 2)}
				/>
			</div>
		</LabSection>
	);
}
