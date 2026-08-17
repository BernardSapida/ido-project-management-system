import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
	isPendingUrl,
	pendingUrlsIn,
	readPending,
	registerPending,
	releasePending,
	withUploadedUrls,
} from "./pending-uploads";

/**
 * These tests guard the seam between "the author picked a file" and "the record
 * points at S3".
 *
 * The failure they exist to catch is silent: a form that saves an object URL.
 * The record takes it, the admin table looks right, and the banner is blank the
 * next time anybody loads the page - by which point the file is gone and the
 * tab that held it has been closed for days. So the cases below are mostly
 * about the URLs that must NOT be rewritten and the ones that must not survive.
 */

const S3 = "https://revolve-images-prod.s3.ap-southeast-1.amazonaws.com/blogs/banner.jpg";

let nextObjectUrl = 0;

beforeAll(() => {
	// jsdom is not loaded for this suite - these are the only two browser APIs
	// the module touches, and stubbing them keeps it a plain node test.
	URL.createObjectURL = vi.fn(() => `blob:http://localhost/${nextObjectUrl++}`);
	URL.revokeObjectURL = vi.fn();
});

function pngFile(name = "banner.png", size = 1000) {
	return new File([new Uint8Array(size)], name, { type: "image/png" });
}

describe("isPendingUrl", () => {
	it("is true only for object URLs", () => {
		expect(isPendingUrl("blob:http://localhost/abc")).toBe(true);
		expect(isPendingUrl(S3)).toBe(false);
		expect(isPendingUrl("https://example.com/photo.jpg")).toBe(false);
		expect(isPendingUrl("")).toBe(false);
	});

	/*
	 * A `data:` URL is what the OLD uploader stored, and rows written by it are
	 * still editable. Treating one as pending would send a flush looking for a
	 * file that was never picked in this tab, and the save would fail on a post
	 * the author only wanted to retitle.
	 */
	it("does not claim a legacy data: URL", () => {
		expect(isPendingUrl("data:image/png;base64,iVBORw0KGgo=")).toBe(false);
	});
});

describe("registerPending", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("hands back a pending URL that resolves to the file and its folder", () => {
		const file = pngFile("speaker.png");
		const url = registerPending(file, "uploads");

		expect(isPendingUrl(url)).toBe(true);
		expect(readPending(url)).toEqual({ file, folder: "uploads" });
	});

	/*
	 * The flush is retried after a failed save, so a lookup that consumed its
	 * entry would make the second attempt upload nothing and store a URL for
	 * bytes that were never sent.
	 */
	it("does not consume the entry when it is read", () => {
		const url = registerPending(pngFile(), "uploads");

		expect(readPending(url)).toBeDefined();
		expect(readPending(url)).toBeDefined();
	});

	it("releases the bytes and forgets the URL", () => {
		const url = registerPending(pngFile(), "uploads");

		releasePending([url]);

		expect(readPending(url)).toBeUndefined();
		expect(URL.revokeObjectURL).toHaveBeenCalledWith(url);
	});

	/* Two forms share one registry. Releasing a URL that is not ours must not
	   revoke somebody else's file out from under a form still showing it. */
	it("ignores a URL it never registered", () => {
		releasePending(["blob:http://localhost/never-registered"]);

		expect(URL.revokeObjectURL).not.toHaveBeenCalled();
	});
});

describe("pendingUrlsIn", () => {
	it("reports only the rows still held in the browser", () => {
		const pending = registerPending(pngFile(), "uploads");

		const urls = pendingUrlsIn([{ url: pending }, { url: S3 }, { url: undefined }, {}]);

		expect(urls).toEqual([pending]);
	});
});

describe("withUploadedUrls", () => {
	it("swaps the uploaded ones and leaves everything else alone", () => {
		const uploaded = new Map([["blob:http://localhost/1", S3]]);

		const rows = withUploadedUrls(
			[
				{ name: "new", url: "blob:http://localhost/1" },
				{ name: "existing", url: "https://example.com/old.jpg" },
				{ name: "empty", url: undefined },
			],
			uploaded,
		);

		expect(rows).toEqual([
			{ name: "new", url: S3 },
			{ name: "existing", url: "https://example.com/old.jpg" },
			{ name: "empty", url: undefined },
		]);
	});

	/* Every other field on the row is what the record stores - `name` becomes
	   the alt text. Rebuilding the row instead of spreading it would save every
	   picture as "undefined". */
	it("keeps the rest of the row", () => {
		const [row] = withUploadedUrls(
			[{ id: "banner", name: "Shoreline", size: 42, type: "image/png", url: "blob:x" }],
			new Map([["blob:x", S3]]),
		);

		expect(row).toEqual({ id: "banner", name: "Shoreline", size: 42, type: "image/png", url: S3 });
	});
});
