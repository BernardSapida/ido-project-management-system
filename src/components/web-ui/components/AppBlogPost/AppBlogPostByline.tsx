import { CalendarDays, Check, FileClock, Link2 } from "lucide-react";
import { useState } from "react";
import { AppAvatar } from "../AppAvatar";
import { AppButton } from "../AppButton";
import { AppChip } from "../AppChip";
import { AppTooltip } from "../AppTooltip";
import type { BlogPostAuthor } from "./blog-post.types";

interface AppBlogPostBylineProps {
	author: BlogPostAuthor;
	"data-cy"?: string;
	/** Omit it and no copy-link button renders - there is nothing to copy. */
	onCopyLink?: () => void;
	/** Null is a DRAFT, and says so. */
	publishedAt: Date | null;
	readingMinutes: number;
}

/**
 * Who wrote it, when, how long it takes, and the way to share it.
 *
 * ## The date is ABSOLUTE, with the relative form as its tooltip
 *
 * This is the one that gets built backwards. "About a year ago" is friendly and
 * useless: the question a reader actually has about a technical post's date is
 * whether it predates the version they are running, and no relative phrasing
 * answers that. So the visible date is "8 August 2026" and hovering it gives
 * "about a year ago" - the nicety is the hover, not the fact.
 *
 * ## A null date is a draft
 *
 * Falling back to `createdAt` would print a date on which no reader has ever
 * been able to see the post. A Draft chip is the honest reading, and it makes an
 * unpublished post impossible to mistake for a published one in a preview.
 */
export function AppBlogPostByline({
	author,
	"data-cy": dataCy,
	onCopyLink,
	publishedAt,
	readingMinutes,
}: AppBlogPostBylineProps) {
	const [hasCopied, setHasCopied] = useState(false);

	const handleCopy = () => {
		onCopyLink?.();
		setHasCopied(true);
		window.setTimeout(() => setHasCopied(false), 2000);
	};

	return (
		<div
			className="flex flex-wrap items-center gap-3"
			data-cy={dataCy}
		>
			<AppAvatar
				name={author.name}
				size="sm"
				src={author.avatarUrl}
			/>

			<div className="min-w-0 flex-1">
				<p className="truncate font-medium text-sm">{author.name}</p>
				<p className="flex flex-wrap items-center gap-x-1.5 text-muted text-xs">
					{publishedAt ? (
						<AppTooltip
							description={formatRelative(publishedAt)}
							icon={CalendarDays}
							title="Published"
						>
							{/* A `time` element, so the machine-readable date is in the markup
							    rather than only in the sentence a human reads. */}
							<time
								className="cursor-default"
								data-cy="blog-post-date"
								dateTime={publishedAt.toISOString()}
							>
								{formatAbsolute(publishedAt)}
							</time>
						</AppTooltip>
					) : (
						<AppChip
							data-cy="blog-post-draft"
							icon={FileClock}
							label="Draft"
							size="sm"
							tone="warning"
						/>
					)}
					<span aria-hidden="true">·</span>
					<span>{readingMinutes} min read</span>
				</p>
			</div>

			{onCopyLink ? (
				/*
				 * Confirms ON THE BUTTON rather than in a toast. A clipboard write has
				 * no visible result of its own, so it needs feedback - but a toast for
				 * it is a second thing to read, in another corner, for an action the
				 * user just pointed at.
				 */
				<AppButton
					data-cy="blog-post-copy-link"
					icon={hasCopied ? Check : Link2}
					onPress={handleCopy}
					size="sm"
					variant="secondary"
				>
					{hasCopied ? "Link copied" : "Copy link"}
				</AppButton>
			) : null}
		</div>
	);
}

/** "8 August 2026". The reader's own locale decides the order of the parts. */
function formatAbsolute(date: Date): string {
	return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "long", year: "numeric" }).format(date);
}

/**
 * "about a year ago", from `Intl.RelativeTimeFormat` rather than a date library.
 *
 * The whole need here is one tooltip, and it is not worth a dependency that
 * ships every locale's grammar to do it.
 */
function formatRelative(date: Date): string {
	const seconds = Math.round((date.getTime() - Date.now()) / 1000);
	const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

	const units: [Intl.RelativeTimeFormatUnit, number][] = [
		["year", 60 * 60 * 24 * 365],
		["month", 60 * 60 * 24 * 30],
		["week", 60 * 60 * 24 * 7],
		["day", 60 * 60 * 24],
		["hour", 60 * 60],
		["minute", 60],
	];

	for (const [unit, size] of units) {
		if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
	}
	return formatter.format(seconds, "second");
}
