/**
 * A scribble that stands in for a signature on the PDF walkthrough.
 *
 * ## Why this exists twice
 *
 * `prisma/seed-signature.ts` draws the same thing for the seeded accounts, and
 * this is deliberately NOT that module: the seeder builds a PNG by hand with
 * `node:zlib` because it runs in Node, and importing it here would pull a Node
 * builtin into the browser bundle. The canvas does the same job in three lines
 * and produces the same waveform, so the walkthrough and the seeded forms look
 * like the same office signed them.
 *
 * ## They are furniture, not anybody's signature
 *
 * The walkthrough is a reference page showing what the form looks like at each
 * stage. Nothing here is a real person's mark, and no real signature is ever
 * fetched for it - the page never touches the server.
 */

const WIDTH = 420;
const HEIGHT = 140;
const INK = "#161e42";

/** One stable number per name, so a scenario redrawn on the next render is the
 *  same scribble and the preview does not flicker between stages. */
function seedFrom(name: string): number {
	let hash = 2166136261;

	for (let index = 0; index < name.length; index++) {
		hash ^= name.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}

	return (hash >>> 0) / 0xffffffff;
}

const cache = new Map<string, string>();

/**
 * `null` on the server, where there is no canvas.
 *
 * The caller passes the result straight into `RequestPdfViewer`, which holds on
 * its loading state until it has mounted - so the PDF subtree never renders
 * during SSR and a null here cannot cause a hydration mismatch.
 */
export function demoSignature(name: string): string | null {
	if (typeof document === "undefined") return null;

	const cached = cache.get(name);
	if (cached) return cached;

	const canvas = document.createElement("canvas");
	canvas.width = WIDTH;
	canvas.height = HEIGHT;

	const ctx = canvas.getContext("2d");
	if (!ctx) return null;

	const seed = seedFrom(name);
	const amplitude = 16 + seed * 14;
	const frequency = 3.4 + seed * 2.6;
	const phase = seed * Math.PI * 2;
	const baseline = HEIGHT * 0.52;
	const left = 34;
	const right = WIDTH - 46;

	ctx.strokeStyle = INK;
	ctx.lineCap = "round";
	ctx.lineJoin = "round";

	// The body of the name: two overlaid sines, thinning towards the end the way
	// a pen lifting does.
	ctx.lineWidth = 3.4;
	ctx.beginPath();
	for (let t = 0; t <= 1; t += 0.002) {
		const x = left + t * (right - left);
		const y =
			baseline +
			Math.sin(t * frequency * Math.PI * 2 + phase) * amplitude * (1 - t * 0.35) +
			Math.sin(t * frequency * 2.7 * Math.PI * 2 + phase * 1.7) * amplitude * 0.32;

		if (t === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	}
	ctx.stroke();

	// The tail, flicking up past the end of the name.
	ctx.lineWidth = 2.4;
	ctx.beginPath();
	for (let t = 0; t <= 1; t += 0.01) {
		const x = right - 30 + t * 70;
		const y = baseline - 6 - t * t * 34;

		if (t === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	}
	ctx.stroke();

	// The underline, bowed slightly so it reads as hand-drawn.
	ctx.lineWidth = 2;
	ctx.beginPath();
	for (let t = 0; t <= 1; t += 0.01) {
		const x = left - 8 + t * (right - left + 30);
		const y = baseline + 34 + Math.sin(t * Math.PI) * 3.5;

		if (t === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	}
	ctx.stroke();

	const uri = canvas.toDataURL("image/png");
	cache.set(name, uri);

	return uri;
}
