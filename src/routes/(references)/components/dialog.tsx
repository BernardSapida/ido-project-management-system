import { AppButton, AppDialog, AppGlassCard, AppPageHeader, AppToast, type DialogTone } from "@bernardsapida/web-ui";
import { Input, Label, TextField } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import {
	AlertTriangle,
	CalendarClock,
	CheckCircle2,
	CloudOff,
	Info,
	LogOut,
	Package,
	Send,
	Trash2,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { seo } from "@/config/seo.config";

/**
 * Dialog lab. Developer reference under /components, which owns the backdrop and
 * the nav; every page there is noindex.
 *
 * The thing to actually try on this page is the second section. Press Confirm
 * and then, while the spinner is running, click the backdrop, press Escape, and
 * press Cancel. None of them do anything until the promise settles - a dialog
 * you can dismiss mid-write leaves you unable to say whether the write happened.
 *
 * Everything here is faked with a timer; nothing on this page touches the api.
 */
export const Route = createFileRoute("/(references)/components/dialog")({
	head: () => ({
		meta: [{ title: seo.title("Dialog lab") }, { content: "noindex", name: "robots" }],
	}),
	component: DialogLabPage,
});

/** Stands in for a mutation. Resolves, or rejects when asked to. */
function fakeWork(ms: number, shouldFail = false) {
	return new Promise<void>((resolve, reject) => {
		setTimeout(() => (shouldFail ? reject(new Error("network")) : resolve()), ms);
	});
}

function DialogLabPage() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="The surface that stops the app until a question is answered - and what it does while the answer is being processed."
				title="Dialog lab"
			/>
			<DefaultSection />
			<ProcessingSection />
			<DestructiveSection />
			<TypeToConfirmSection />
			<FailureSection />
			<TonesSection />
			<ContentSection />
			<SmallInputSection />
			<RestraintSection />
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

function Row({ children }: { children: ReactNode }) {
	return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

/* -------------------------------------------------------------------------- */

/** The routine confirmation - reversible, so it resolves at once. */
function DefaultSection() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<LabSection
			description="Icon tile, title, description, two answers. The confirm button names the action - 'Send request', never 'Yes' - because the verb is what gets read and nobody reads the paragraph above it. Cancel is first in the DOM and first on screen, so Tab and the eye agree on both breakpoints."
			title="Default"
		>
			<Row>
				<AppButton
					data-cy="open-default"
					onPress={() => setIsOpen(true)}
					variant="secondary"
				>
					Send request
				</AppButton>
			</Row>
			<AppDialog
				confirmLabel="Send request"
				data-cy="dialog-default"
				description="Every warehouse within 25km will be offered this order. You can withdraw it at any time before one accepts."
				icon={Send}
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
				onConfirm={() => {
					AppToast.success("Request sent", {
						description: "42 warehouses were notified.",
						icon: Send,
					});
				}}
				title="Send this request?"
				tone="accent"
			/>
		</LabSection>
	);
}

/** The one that matters: what the dialog does for the length of the promise. */
function ProcessingSection() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<LabSection
			description="Return a promise from onConfirm and the button spins for as long as it runs - and every other way out locks with it. Try the backdrop, Escape and Cancel while this one is working: all three are dead until it settles. That also makes a double-fire impossible, since the button is disabled for the whole round trip. pendingLabel replaces the verb while it runs, so the state has words as well as a spinner."
			title="Processing"
		>
			<Row>
				<AppButton
					data-cy="open-processing"
					onPress={() => setIsOpen(true)}
					variant="secondary"
				>
					Confirm booking (3s)
				</AppButton>
			</Row>
			<AppDialog
				confirmLabel="Confirm booking"
				data-cy="dialog-processing"
				description="Makati Central Hub, Tuesday 12 August at 09:30. We will hold the slot for you and send a reminder the evening before."
				icon={CalendarClock}
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
				onConfirm={async () => {
					await fakeWork(3000);
					AppToast.success("Booking confirmed", {
						description: "Tuesday 12 August, 09:30 at Makati Central Hub.",
						icon: CheckCircle2,
					});
				}}
				pendingLabel="Confirming…"
				title="Confirm this booking?"
				tone="accent"
			/>
		</LabSection>
	);
}

/** Danger: red confirm, alertdialog role, and focus that starts on the way out. */
function DestructiveSection() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<LabSection
			description="tone='danger' does three things at once: the confirm button becomes variant='danger' (there is no color prop in HeroUI v3, and guessing one ships a grey delete button), the dialog takes role='alertdialog' so a screen reader is interrupted rather than made to wait, and Cancel takes the initial focus - open this with the keyboard and a stray Enter dismisses instead of destroying. Red is a budget; spend it here and not on logout."
			title="Destructive"
		>
			<Row>
				<AppButton
					data-cy="open-destructive"
					onPress={() => setIsOpen(true)}
					variant="secondary"
				>
					Withdraw request
				</AppButton>
			</Row>
			<AppDialog
				cancelLabel="Keep it open"
				confirmLabel="Withdraw request"
				data-cy="dialog-destructive"
				description="The 42 warehouses already notified will be told the order is closed. Any that accepted will lose the allocation."
				icon={AlertTriangle}
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
				onConfirm={async () => {
					await fakeWork(1500);
					AppToast.warning("Request withdrawn", {
						description: "42 warehouses were told it is closed.",
						icon: AlertTriangle,
					});
				}}
				pendingLabel="Withdrawing…"
				title="Withdraw this request?"
				tone="danger"
			/>
		</LabSection>
	);
}

/** No way back, so the friction is earned rather than assumed. */
function TypeToConfirmSection() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<LabSection
			description="For the actions with no undo. The confirm button stays disabled until the phrase is typed exactly, which is what stops muscle memory reaching a destructive button in a familiar position. Focus starts in the field, not on Cancel - it is the only thing that can be acted on until it matches. Use the resource's own name; 'DELETE' teaches nothing about what is about to go."
			title="Type to confirm"
		>
			<Row>
				<AppButton
					data-cy="open-typed"
					onPress={() => setIsOpen(true)}
					variant="secondary"
				>
					Delete account
				</AppButton>
			</Row>
			<AppDialog
				cancelLabel="Keep my account"
				confirmationText="bernard@example.com"
				confirmLabel="Delete account"
				data-cy="dialog-typed"
				description="Your order history, your saved addresses and every open order go with it. This cannot be undone and there is no recovery window."
				icon={Trash2}
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
				onConfirm={async () => {
					await fakeWork(2000);
					AppToast.success("Account deleted", {
						description: "Nothing was really deleted - this is a lab page.",
						icon: Trash2,
					});
				}}
				pendingLabel="Deleting…"
				title="Delete your account?"
				tone="danger"
			/>
		</LabSection>
	);
}

/** What a rejected promise does - which is nothing except stop spinning. */
function FailureSection() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<LabSection
			description="This one always rejects. The dialog stays open with the typing intact so the attempt can be retried, and the failure is reported by the caller - a toast from the mutation's onError - not by the dialog. Closing over a write that never landed is the one outcome worse than the error itself."
			title="When it fails"
		>
			<Row>
				<AppButton
					data-cy="open-failure"
					onPress={() => setIsOpen(true)}
					variant="secondary"
				>
					Confirm (always fails)
				</AppButton>
			</Row>
			<AppDialog
				confirmLabel="Mark as delivered"
				data-cy="dialog-failure"
				description="This closes the order and releases the reserved stock back to the warehouse."
				icon={Package}
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
				onConfirm={async () => {
					try {
						await fakeWork(1800, true);
					} catch (error) {
						AppToast.error("Couldn't close the order", {
							description: "Nothing was saved. Check your connection and confirm again.",
							icon: CloudOff,
						});
						throw error;
					}
				}}
				pendingLabel="Recording…"
				title="Close this order?"
				tone="accent"
			/>
		</LabSection>
	);
}

/** Three of the toast and banner's five rails - the three a question can have. */
function TonesSection() {
	const [openTone, setOpenTone] = useState<DialogTone | null>(null);

	const tones: {
		copy: string;
		icon: typeof Info;
		label: string;
		tone: DialogTone;
	}[] = [
		{
			copy: "You will be signed out on this device only.",
			icon: LogOut,
			label: "Default",
			tone: "default",
		},
		{
			copy: "The order goes out to every matching warehouse.",
			icon: Send,
			label: "Accent",
			tone: "accent",
		},
		{
			copy: "This removes the record permanently.",
			icon: Trash2,
			label: "Danger",
			tone: "danger",
		},
	];

	return (
		<LabSection
			description="Three, not the toast and banner's five. Those two report on something that already happened, so the full severity set fits them; a dialog asks, and there is no such thing as a success question - a green tile over 'Send this request?' paints the answer before it is given. Note also that the confirm button follows emphasis, not tone: it is the accent everywhere except danger. A button's colour says 'this is the action', and toning it would pre-announce the outcome in a second colour that means nothing anywhere else in the app."
			title="Tones"
		>
			<Row>
				{tones.map(({ label, tone }) => (
					<AppButton
						key={tone}
						onPress={() => setOpenTone(tone)}
						size="sm"
						variant="secondary"
					>
						{label}
					</AppButton>
				))}
			</Row>
			{tones.map(({ copy, icon, label, tone }) => (
				<AppDialog
					confirmLabel={`${label} action`}
					description={copy}
					icon={icon}
					isOpen={openTone === tone}
					key={tone}
					onClose={() => setOpenTone(null)}
					onConfirm={() => setOpenTone(null)}
					title={`A ${label.toLowerCase()} decision`}
					tone={tone}
				/>
			))}
		</LabSection>
	);
}

/** The children slot: what the user needs in front of them to decide. */
function ContentSection() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<LabSection
			description="children renders under the description, above the confirmation field. Put what the decision is actually about in here - the parsed amount, the date, the row being replaced - so the user is confirming the thing rather than confirming their memory of the thing."
			title="With content"
		>
			<Row>
				<AppButton
					data-cy="open-content"
					onPress={() => setIsOpen(true)}
					variant="secondary"
				>
					Accept allocation
				</AppButton>
			</Row>
			<AppDialog
				confirmLabel="Accept allocation"
				data-cy="dialog-content"
				description="You are committing this warehouse to fulfil the order. The customer sees your site name and service level once you accept."
				icon={Package}
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
				onConfirm={async () => {
					await fakeWork(1500);
					AppToast.success("Allocation accepted", {
						description: "The requester has been notified.",
						icon: CheckCircle2,
					});
				}}
				pendingLabel="Accepting…"
				title="Accept this allocation?"
				tone="accent"
			>
				<dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-2xl bg-muted-surface p-4 text-sm">
					<dt className="text-muted">Service level</dt>
					<dd className="font-semibold text-foreground">O-</dd>
					<dt className="text-muted">Warehouse</dt>
					<dd className="font-semibold text-foreground">Makati Central Hub</dd>
					<dt className="text-muted">Needed by</dt>
					<dd className="font-semibold text-foreground">Tue 12 Aug, 18:00</dd>
				</dl>
			</AppDialog>
		</LabSection>
	);
}

/**
 * The capability that makes this the ACTION surface rather than the question
 * surface: a decision that needs one thing typed before it can be made.
 */
function SmallInputSection() {
	const [isOpen, setIsOpen] = useState(false);
	const [reason, setReason] = useState("");

	return (
		<LabSection
			description="A field passed through children, and focus lands on it rather than on Cancel - it is the only thing that can be acted on until it is filled. This is where the line sits: a password, a rejection reason, a typed confirmation are all small enough that losing them costs nothing, so there is deliberately NO discard guard here and Escape simply closes. The moment the answer to 'what if they lose this?' stops being 'nothing', it is an AppDrawer. Open it and the confirm button is already dead: the field is isRequired, and the dialog gates the button on that, enabling it on the keystroke that answers the question rather than letting a press through to an error."
			title="With a small input"
		>
			<Row>
				<AppButton
					data-cy="open-small-input"
					onPress={() => setIsOpen(true)}
					variant="secondary"
				>
					Reject warehouse
				</AppButton>
			</Row>
			<AppDialog
				cancelLabel="Keep it pending"
				confirmLabel="Reject warehouse"
				data-cy="dialog-small-input"
				description="BGC Fulfilment Centre will be told its registration was refused, and the reason below is sent with it."
				icon={AlertTriangle}
				isOpen={isOpen}
				onClose={() => {
					setIsOpen(false);
					setReason("");
				}}
				onConfirm={async () => {
					// No empty-reason guard here any more: the field is `isRequired`, so
					// the confirm button cannot be pressed until it has one. Throwing is
					// still the door a FAILED WRITE leaves by - see the pending section.
					await fakeWork(1200);
					AppToast.warning("Warehouse rejected", {
						description: "The applicant has been told why.",
						icon: AlertTriangle,
					});
				}}
				pendingLabel="Rejecting…"
				title="Reject this warehouse?"
				tone="danger"
			>
				{/* `isRequired` is the whole wiring. It draws nothing here - HeroUI's
				    bare TextField has no asterisk of its own - but it is what the
				    dialog's gate reads to hold the confirm button. */}
				<TextField
					className="w-full"
					isRequired
					onChange={setReason}
					value={reason}
				>
					<Label>Reason</Label>
					<Input placeholder="Licence number could not be verified" />
				</TextField>
			</AppDialog>
		</LabSection>
	);
}

/** The section arguing for using none of the above. */
function RestraintSection() {
	return (
		<LabSection
			description="Most confirmations should not exist. 'Are you sure?' punishes everyone for one person's mistake; Undo punishes nobody. If the action is reversible, do it immediately and put Undo in the toast - a dialog is only correct where there is genuinely no way back, which is where the type-to-confirm section above starts. A dialog is also the wrong surface for information: something transient is a toast, a condition that persists beside the work is an AppAlert banner, and something to READ at full size is an AppModal. Past one or two small fields it stops being a decision and becomes a task, which is an AppDrawer."
			title="When not to use it"
		>
			<Row>
				<AppButton
					onPress={() =>
						AppToast.warning("Request archived", {
							description: "It will be permanently deleted in 30 days.",
							icon: Info,
						})
					}
					variant="secondary"
				>
					Archive (no dialog, undo in the toast)
				</AppButton>
			</Row>
		</LabSection>
	);
}
