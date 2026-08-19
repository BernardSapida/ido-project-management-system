import { deflateSync } from "node:zlib";

/**
 * A demo signature image, as a `data:` URI, generated rather than shipped.
 *
 * ## Why the seeder has to produce one at all
 *
 * Four of the seven flows stop dead without it. `approveBudget`,
 * `approveByDirector`, `idoFinalApprove` and `finalDirectorApprove` all refuse
 * with FORBIDDEN when the acting profile has no `signatureUrl` - deliberately,
 * because an approval with no image stamps a blank box onto a signed instrument.
 * A seed that leaves every staff signature null therefore hands you a demo that
 * cannot get past flow 03 step 3, and the failure arrives as a permission error
 * that looks like a bug in the gate rather than missing setup.
 *
 * ## Why a `data:` URI and not an S3 object
 *
 * The seed must work on a machine with no bucket configured, and it does: nothing
 * downstream cares where the bytes came from. `storedImageUrl` rejects only
 * `blob:` pending URLs, and the PDF's `signatureAsDataUri` fetches the value with
 * `fetch` - which resolves `data:` URIs natively and reports `image/png`, so it
 * passes the content-type check and embeds unchanged.
 *
 * These are scribbles belonging to fictional seeded accounts. They are demo
 * furniture, not anybody's real signature, and a deployment that seeds real
 * staff must have those people upload their own.
 */

const WIDTH = 420;
const HEIGHT = 140;
const INK: [number, number, number] = [22, 30, 66];

/** One CRC per chunk, which PNG requires and nothing else here provides. */
function crc32(buf: Buffer): number {
	let crc = 0xffffffff;

	for (const byte of buf) {
		crc ^= byte;

		for (let bit = 0; bit < 8; bit++) {
			crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
		}
	}

	return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
	const length = Buffer.alloc(4);
	length.writeUInt32BE(data.length);

	const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
	const crc = Buffer.alloc(4);
	crc.writeUInt32BE(crc32(body));

	return Buffer.concat([length, body, crc]);
}

/**
 * A stable number per name, so one account's signature is the same scribble on
 * every re-seed. A random one would change the image under requests that were
 * already signed, and the printed form would quietly gain a new signature for a
 * decision nobody revisited.
 */
function seedFrom(name: string): number {
	let hash = 2166136261;

	for (let i = 0; i < name.length; i++) {
		hash ^= name.charCodeAt(i);
		hash = Math.imul(hash, 16777619);
	}

	return (hash >>> 0) / 0xffffffff;
}

/** RGBA, so the stroke sits on the form's ruled line instead of on a white box. */
function blankCanvas(): Uint8Array {
	return new Uint8Array(WIDTH * HEIGHT * 4);
}

/** A round nib rather than a single pixel - a one-pixel line reads as a hairline
 *  scratch at print size. Alpha is accumulated, so overlapping passes darken. */
function nib(px: Uint8Array, cx: number, cy: number, radius: number): void {
	const from = Math.floor(-radius);
	const to = Math.ceil(radius);

	for (let dy = from; dy <= to; dy++) {
		for (let dx = from; dx <= to; dx++) {
			const distance = Math.sqrt(dx * dx + dy * dy);
			if (distance > radius) continue;

			const x = Math.round(cx + dx);
			const y = Math.round(cy + dy);
			if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) continue;

			// Soft edge, so the stroke does not alias into a staircase.
			const alpha = Math.round(255 * Math.min(1, (radius - distance) / 1.2 + 0.35));
			const at = (y * WIDTH + x) * 4;

			px[at] = INK[0];
			px[at + 1] = INK[1];
			px[at + 2] = INK[2];
			px[at + 3] = Math.max(px[at + 3], alpha);
		}
	}
}

function encodePng(px: Uint8Array): Buffer {
	const header = Buffer.alloc(13);
	header.writeUInt32BE(WIDTH, 0);
	header.writeUInt32BE(HEIGHT, 4);
	header[8] = 8; // bit depth
	header[9] = 6; // colour type: RGBA
	header[10] = 0; // deflate
	header[11] = 0; // adaptive filtering
	header[12] = 0; // no interlace

	// Filter byte 0 in front of every scanline: no prediction, which costs a few
	// hundred bytes and saves implementing four filter types for an image nobody
	// is optimising.
	const raw = Buffer.alloc(HEIGHT * (1 + WIDTH * 4));
	for (let y = 0; y < HEIGHT; y++) {
		const rowStart = y * (1 + WIDTH * 4);
		raw[rowStart] = 0;
		Buffer.from(px.buffer, y * WIDTH * 4, WIDTH * 4).copy(raw, rowStart + 1);
	}

	return Buffer.concat([
		Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		chunk("IHDR", header),
		chunk("IDAT", deflateSync(raw, { level: 9 })),
		chunk("IEND", Buffer.alloc(0)),
	]);
}

/**
 * The scribble itself: two overlaid sine waves for the body of the name, a
 * rising flourish for the tail, and an underline. It is not meant to spell
 * anything - a signature on a demo form has to look like a signature at a
 * glance, and nothing more.
 */
export function signatureDataUri(name: string): string {
	const px = blankCanvas();
	const seed = seedFrom(name);

	const amplitude = 16 + seed * 14;
	const frequency = 3.4 + seed * 2.6;
	const phase = seed * Math.PI * 2;
	const baseline = HEIGHT * 0.52;
	const left = 34;
	const right = WIDTH - 46;

	for (let t = 0; t <= 1; t += 0.0006) {
		const x = left + t * (right - left);
		const y =
			baseline +
			Math.sin(t * frequency * Math.PI * 2 + phase) * amplitude * (1 - t * 0.35) +
			Math.sin(t * frequency * 2.7 * Math.PI * 2 + phase * 1.7) * amplitude * 0.32;

		// The nib thins towards the end of the stroke, the way a pen lifting does.
		nib(px, x, y, 2.6 - t * 1.1);
	}

	// The tail: a rising flick past the end of the name.
	for (let t = 0; t <= 1; t += 0.002) {
		const x = right - 30 + t * 70;
		const y = baseline - 6 - t * t * 34;
		nib(px, x, y, 1.9 - t * 0.9);
	}

	// The underline, drawn slightly off-level so it reads as hand-drawn.
	for (let t = 0; t <= 1; t += 0.0009) {
		const x = left - 8 + t * (right - left + 30);
		const y = baseline + 34 + Math.sin(t * Math.PI) * 3.5;
		nib(px, x, y, 1.5);
	}

	return `data:image/png;base64,${encodePng(px).toString("base64")}`;
}
