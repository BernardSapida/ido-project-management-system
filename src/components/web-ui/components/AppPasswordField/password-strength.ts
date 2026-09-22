/**
 * Password strength, scored without a dependency.
 *
 * The good answer is an entropy estimator - zxcvbn - which knows that `P@ssw0rd`
 * is two hours from cracked because it is one dictionary word and four
 * substitutions. This repo cannot add it (`pnpm install` is broken upstream), so
 * this is the honest fallback: length carries most of the score, character
 * variety adds a little, and the obvious cheap passwords are capped so the meter
 * cannot call `aaaaaaaaaaaa` strong.
 *
 * It is deliberately not a gate. `AppPasswordField` still validates length
 * through its schema; this only colours a bar and lists what would help.
 */

export type PasswordScore = 0 | 1 | 2 | 3 | 4;

export interface PasswordStrength {
	/** 0 unusable, 1 weak, 2 fair, 3 good, 4 strong. */
	score: PasswordScore;
	/** One word for the bar: "Too short" … "Strong". */
	label: string;
	/** Concrete next steps, most valuable first. Empty at score 4. */
	suggestions: string[];
}

const LABELS = ["Too short", "Weak", "Fair", "Good", "Strong"] as const;

const SEQUENCES = ["abcdefghijklmnopqrstuvwxyz", "01234567890", "qwertyuiop", "asdfghjkl", "zxcvbnm"];

function hasSequentialRun(value: string): boolean {
	const lower = value.toLowerCase();
	for (const sequence of SEQUENCES) {
		for (let i = 0; i + 3 <= sequence.length; i++) {
			if (lower.includes(sequence.slice(i, i + 4))) return true;
		}
	}
	return false;
}

function hasLongRepeat(value: string): boolean {
	return /(.)\1{3,}/.test(value);
}

/** Count of the four character classes present. */
function classCount(value: string): number {
	let count = 0;
	if (/[a-z]/.test(value)) count++;
	if (/[A-Z]/.test(value)) count++;
	if (/[0-9]/.test(value)) count++;
	if (/[^A-Za-z0-9]/.test(value)) count++;
	return count;
}

export function scorePassword(value: string): PasswordStrength {
	const length = value.length;
	const classes = classCount(value);

	const suggestions: string[] = [];
	if (length < 12) suggestions.push("Use 12 or more characters");
	if (!(/[a-z]/.test(value) && /[A-Z]/.test(value))) suggestions.push("Mix upper and lower case");
	if (!/[^A-Za-z0-9]/.test(value)) suggestions.push("Add a symbol (!?@#)");
	if (hasSequentialRun(value) || hasLongRepeat(value)) {
		suggestions.push("Avoid runs like 1234 or repeated characters");
	}

	if (length === 0) return { score: 0, label: LABELS[0], suggestions };
	if (length < 8) return { score: 0, label: LABELS[0], suggestions };

	// Length is the spine of the score.
	let score: number;
	if (length < 10) score = 1;
	else if (length < 12) score = 2;
	else if (length < 16) score = 3;
	else score = 4;

	// Variety nudges a borderline password up one band.
	if (classes >= 3 && score < 4) score += 1;

	// A short password drawn from one character class is weak whatever its
	// length band said. A LONG one is a passphrase - `correcthorsebatterystaple`
	// is all lower case and genuinely strong - so length carries it there, and
	// the repeat / sequence caps below are what still catch `aaaaaaaaaaaaaaaa`.
	if (classes === 1 && length < 16) score = Math.min(score, 1);
	if (hasSequentialRun(value) || hasLongRepeat(value)) score = Math.min(score, 1);

	const clamped = Math.max(0, Math.min(4, score)) as PasswordScore;
	return {
		score: clamped,
		label: LABELS[clamped],
		suggestions: clamped === 4 ? [] : suggestions,
	};
}

/**
 * The "it's better to have" checklist shown under the meter. Soft guidance, not
 * requirements - each line ticks the moment it is satisfied.
 */
export interface PasswordHint {
	id: string;
	label: string;
	met: (value: string) => boolean;
}

export const PASSWORD_HINTS: readonly PasswordHint[] = [
	{
		id: "case",
		label: "Upper & lower case letters",
		met: (value) => /[a-z]/.test(value) && /[A-Z]/.test(value),
	},
	{
		id: "symbol",
		label: "A symbol (#$&)",
		met: (value) => /[^A-Za-z0-9]/.test(value),
	},
	{
		id: "length",
		label: "12 characters or more",
		met: (value) => value.length >= 12,
	},
];
