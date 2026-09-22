import { Accordion } from "@heroui/react";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

interface AccordionItem {
	key: string;
	title: string;
	content: ReactNode;
	subtitle?: string;
}

interface AppAccordionProps {
	/** Test hook on the list. Each panel carries `data-item-key` of its own. */
	"data-cy"?: string;
	items: AccordionItem[];
	selectionMode?: "single" | "multiple";
	defaultExpandedKeys?: string[];
	expandedKeys?: string[];
	onExpandedChange?: (keys: string[]) => void;
	className?: string;
}

/* The same card language as AppRadioGroup, because they are the same gesture: a
   list of options where one is currently the active one. Each panel is its own
   card rather than a row in a ruled block - separators off, gap on.

   Where it parts from the radio group is how a card separates from the page.
   The radio cards are outlined; these are lifted - plain surface, no tint, and
   a shadow that deepens on hover. That leaves the fill saying nothing, so the
   open panel can be the only card on the page wearing an accent border. It is
   the one cue that has to survive a glance down a long FAQ, so nothing else
   competes with it. */
const CARD =
	"group overflow-hidden rounded-lg border border-transparent bg-surface shadow-sm transition-[box-shadow,border-color] duration-200 motion-reduce:transition-none " +
	"hover:shadow-md " +
	"data-expanded:border-2 data-expanded:border-accent data-expanded:shadow-md";

/**
 * A list of disclosure panels, one open at a time by default.
 *
 * `selectionMode` defaults to `"single"` because that is what a FAQ or a
 * settings group wants: opening the next question closes the last, so the list
 * never grows past a screenful and the reader never loses their place. Pass
 * `"multiple"` only when the panels are genuinely independent and a user has
 * reason to compare two of them side by side.
 *
 * Items are data, not children, so the same array can drive a search filter or
 * a deep link to one panel without the caller rebuilding JSX.
 */
export function AppAccordion({
	"data-cy": dataCy,
	items,
	selectionMode = "single",
	defaultExpandedKeys,
	expandedKeys,
	onExpandedChange,
	className,
}: AppAccordionProps) {
	return (
		<Accordion
			allowsMultipleExpanded={selectionMode === "multiple"}
			className={`flex flex-col gap-3 ${className ?? ""}`}
			data-cy={dataCy}
			data-selection-mode={selectionMode}
			defaultExpandedKeys={defaultExpandedKeys}
			expandedKeys={expandedKeys}
			hideSeparator
			onExpandedChange={(keys) => onExpandedChange?.(Array.from(keys as Set<string>))}
		>
			{items.map((item) => (
				<Accordion.Item
					className={CARD}
					data-item-key={item.key}
					id={item.key}
					key={item.key}
				>
					<Accordion.Heading>
						{/* The card owns the hover tint, so the trigger's own grey wash is
						    turned off - otherwise it paints over the accent one. */}
						<Accordion.Trigger className="items-start gap-3 hover:bg-transparent">
							<span className="flex flex-col gap-0.5 text-left">
								<span className="transition-colors group-data-expanded:text-accent">{item.title}</span>
								{item.subtitle && <span className="text-sm text-muted">{item.subtitle}</span>}
							</span>
							{/* className has to go on Indicator, not on the icon: Indicator
							    clones its child and overwrites the child's className. */}
							<Accordion.Indicator className="mt-0.5 transition-colors group-data-expanded:text-accent">
								<ChevronDown />
							</Accordion.Indicator>
						</Accordion.Trigger>
					</Accordion.Heading>
					<Accordion.Panel>
						<Accordion.Body>{item.content}</Accordion.Body>
					</Accordion.Panel>
				</Accordion.Item>
			))}
		</Accordion>
	);
}
