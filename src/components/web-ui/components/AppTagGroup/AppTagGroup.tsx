import { Label, Tag, TagGroup } from "@heroui/react";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

type TagGroupSelectionMode = ComponentProps<typeof TagGroup>["selectionMode"];
type TagGroupSize = ComponentProps<typeof TagGroup>["size"];

interface TagItem {
	key: string;
	label: string;
}

interface AppTagGroupProps {
	className?: string;
	/** Test hook on the group. Each tag derives its own - `${dataCy}-tag-${key}`. */
	"data-cy"?: string;
	/**
	 * What to say when there are no tags. An empty group used to render its
	 * label over nothing at all, which reads as a section that failed to load
	 * rather than one that is genuinely empty.
	 *
	 * @default "None"
	 */
	emptyText?: string;
	/** Hides the label visually. It is still the group's accessible name - this
	 *  is for a group whose heading is already stated right above it. */
	isLabelHidden?: boolean;
	items: TagItem[];
	/**
	 * Names the group - "Applied filters", "Topics". Required: a tag list is a
	 * single tab stop that a screen reader announces as a group, and an unnamed
	 * group is announced as nothing in particular. Use `isLabelHidden` where the
	 * surrounding copy already names it.
	 */
	label: string;
	onRemove?: (key: string) => void;
	onSelectionChange?: (keys: Set<string>) => void;
	selectedKeys?: Set<string> | string[];
	selectionMode?: TagGroupSelectionMode;
	size?: TagGroupSize;
}

/**
 * A row of tags - as labels, as a multi-select, or as removable chips.
 *
 * `selectionMode` defaults to `"none"`, which makes the plain case read-only
 * decoration: a tag that highlights on click without meaning anything is a
 * control that lies about being one.
 *
 * `onRemove` is what makes the tags dismissible, and its absence is what hides
 * the remove buttons - the affordance and the handler cannot drift apart. It
 * receives one key at a time even though React Aria hands over a set, because
 * every call site so far removes from a list by id and unpacking the set at
 * each of them is the same three lines repeated.
 *
 * For a filter bar, prefer `AppFilterBar`, which owns the "clear all" and the
 * count. This is the primitive underneath that kind of thing.
 */
export function AppTagGroup({
	className,
	"data-cy": dataCy,
	emptyText = "None",
	isLabelHidden = false,
	items,
	label,
	onRemove,
	onSelectionChange,
	selectedKeys,
	selectionMode = "none",
	size,
}: AppTagGroupProps) {
	const isEmpty = items.length === 0;

	return (
		<TagGroup
			className={className}
			data-cy={dataCy}
			onRemove={
				onRemove
					? (keys) => {
							for (const k of keys) onRemove(k as string);
						}
					: undefined
			}
			onSelectionChange={onSelectionChange ? (keys) => onSelectionChange(keys as Set<string>) : undefined}
			selectedKeys={selectedKeys ? new Set(selectedKeys) : undefined}
			selectionMode={selectionMode}
			size={size}
		>
			<Label className={cn(isLabelHidden && "sr-only")}>{label}</Label>
			{isEmpty ? (
				/*
				 * Not an empty <TagGroup.List>: a labelled heading with nothing under
				 * it reads as a section that failed rather than one that is empty, and
				 * it leaves a keyboard user a tab stop that goes nowhere.
				 */
				<p
					className="text-sm text-muted"
					data-cy={dataCy ? `${dataCy}-empty` : undefined}
				>
					{emptyText}
				</p>
			) : (
				<TagGroup.List>
					{items.map((item) => (
						<Tag
							data-cy={dataCy ? `${dataCy}-tag-${item.key}` : undefined}
							id={item.key}
							key={item.key}
						>
							{item.label}
							{onRemove && <Tag.RemoveButton />}
						</Tag>
					))}
				</TagGroup.List>
			)}
		</TagGroup>
	);
}
