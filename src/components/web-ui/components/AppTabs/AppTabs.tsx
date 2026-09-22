import { Tabs } from "@heroui/react";
import type { ReactNode } from "react";
import { useRef } from "react";

interface TabItem {
	key: string;
	label: string;
	content: ReactNode;
}

interface AppTabsProps {
	items: TabItem[];
	defaultSelectedKey?: string;
	selectedKey?: string;
	onSelectionChange?: (key: string) => void;
	disabledKeys?: string[];
	className?: string;
	/**
	 * Test hook on the tab group. Each tab and each panel derives its own from
	 * it - `${dataCy}-tab-${key}` and `${dataCy}-panel-${key}` - because a spec
	 * that selects tabs by their visible label breaks the moment the copy is
	 * rewritten, which is the one thing tab labels reliably do.
	 */
	"data-cy"?: string;
	/**
	 * Names the tab list for a screen reader - "Report views", "Account
	 * settings". Required, because the name has to say WHICH set of tabs this
	 * is: two tab sets on one page both announced as "Tabs" are two controls
	 * with one name between them, and a screen-reader user tabbing between them
	 * cannot tell which one they landed in.
	 */
	label: string;
}

/**
 * Peer views of the same subject, one visible at a time.
 *
 * Tabs are for content the user switches BETWEEN, not steps they move THROUGH -
 * a sequence with an order and a finish line is `AppStepper`. If the panels
 * would each want their own URL, they are routes, and the nav belongs in the
 * route tree rather than here.
 *
 * `lastKeyRef` guards `onSelectionChange` against re-firing for the key that is
 * already selected. React Aria calls the handler on re-selection, and callers
 * routinely hang a fetch or a URL write off it - so without this, clicking the
 * active tab refetches, and a handler that sets state from the key loops.
 */
export function AppTabs({
	items,
	label,
	defaultSelectedKey,
	selectedKey,
	onSelectionChange,
	disabledKeys,
	className,
	"data-cy": dataCy,
}: AppTabsProps) {
	const lastKeyRef = useRef<string | null>(null);

	return (
		<Tabs
			className={className}
			data-cy={dataCy}
			defaultSelectedKey={defaultSelectedKey ?? items[0]?.key}
			disabledKeys={disabledKeys}
			onSelectionChange={(key) => {
				const strKey = String(key);
				if (strKey === lastKeyRef.current) return;
				lastKeyRef.current = strKey;
				onSelectionChange?.(strKey);
			}}
			selectedKey={selectedKey}
		>
			<Tabs.ListContainer>
				<Tabs.List aria-label={label}>
					{items.map((item) => (
						<Tabs.Tab
							className="whitespace-nowrap data-[selected=true]:text-(--gradient-brand-foreground)"
							data-cy={dataCy ? `${dataCy}-tab-${item.key}` : undefined}
							id={item.key}
							key={item.key}
						>
							{item.label}
							<Tabs.Indicator className="gradient-brand" />
						</Tabs.Tab>
					))}
				</Tabs.List>
			</Tabs.ListContainer>
			{items.map((item) => (
				<Tabs.Panel
					className="pt-4"
					data-cy={dataCy ? `${dataCy}-panel-${item.key}` : undefined}
					id={item.key}
					key={item.key}
				>
					{item.content}
				</Tabs.Panel>
			))}
		</Tabs>
	);
}
