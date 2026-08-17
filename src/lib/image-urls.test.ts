import { describe, expect, it } from "vitest";
import { collectRichTextImageUrls, diffImageUrls } from "./image-urls";

/**
 * These guard a deletion path, so they are written from the sweep's point of
 * view: a URL the collector fails to report is an image the sweep will delete
 * while a live record is still showing it.
 *
 * That makes the interesting cases the MALFORMED ones. A document shaped the way
 * the schema describes is the easy half; the half that loses data is a Json
 * column hand-edited into something the editor cannot open.
 *
 * When you add per-model collectors to `image-urls.ts`, add their tests here.
 */

const S3 = "https://example-images-prod.s3.ap-southeast-1.amazonaws.com";

describe("collectRichTextImageUrls", () => {
	it("finds images nested inside lists and quotes", () => {
		const body = {
			content: [
				{ content: [{ text: "Intro", type: "text" }], type: "paragraph" },
				{
					content: [
						{
							content: [
								{ content: [{ attrs: { src: `${S3}/uploads/2026/08/deep.jpg` }, type: "image" }], type: "listItem" },
							],
							type: "bulletList",
						},
					],
					type: "blockquote",
				},
			],
			type: "doc",
		};

		expect(collectRichTextImageUrls(body)).toEqual([`${S3}/uploads/2026/08/deep.jpg`]);
	});

	it("returns nothing for a document with no images", () => {
		expect(collectRichTextImageUrls({ content: [{ type: "paragraph" }], type: "doc" })).toEqual([]);
	});

	// A Json column holds whatever last wrote it. Every one of these is a row a
	// hand-edit or an older schema can produce, and each must be an empty result
	// rather than a throw - the sweep walks EVERY row, so one bad document must
	// not abort the run partway through its deletes.
	it.each([
		["null", null],
		["undefined", undefined],
		["a string", "not a document"],
		["a number", 42],
		["an empty object", {}],
	])("survives %s", (_label, body) => {
		expect(() => collectRichTextImageUrls(body)).not.toThrow();
	});

	it("still finds images in a bare array, because a hand-edited row is not a reason to delete them", () => {
		expect(collectRichTextImageUrls([{ attrs: { src: `${S3}/loose.jpg` }, type: "image" }])).toEqual([
			`${S3}/loose.jpg`,
		]);
	});

	it("ignores an image node with no usable src", () => {
		const body = {
			content: [
				{ attrs: {}, type: "image" },
				{ attrs: { src: "" }, type: "image" },
				{ attrs: { src: "   " }, type: "image" },
				{ attrs: { src: 12 }, type: "image" },
				{ type: "image" },
			],
			type: "doc",
		};

		expect(collectRichTextImageUrls(body)).toEqual([]);
	});

	it("terminates on a document nested past the depth cap", () => {
		let body: Record<string, unknown> = { attrs: { src: `${S3}/buried.jpg` }, type: "image" };
		for (let i = 0; i < 500; i++) body = { content: [body], type: "paragraph" };

		// The point is that it RETURNS. Anything past the cap is unreachable by the
		// editor anyway, so losing it is acceptable; hanging the sweep is not.
		expect(() => collectRichTextImageUrls({ content: [body], type: "doc" })).not.toThrow();
	});
});

describe("diffImageUrls", () => {
	it("reports what went and what arrived", () => {
		const { added, removed } = diffImageUrls(["a", "b", "c"], ["b", "c", "d"]);

		expect(added).toEqual(["d"]);
		expect(removed).toEqual(["a"]);
	});

	/**
	 * The case a list of trash-icon presses gets wrong.
	 *
	 * Remove an image, change your mind, put the same one back, then save. A
	 * queue of user actions says "delete this"; the two states say it is still in
	 * use. Deleting it would blank the record that was just saved with it.
	 */
	it("does not remove an image that was taken out and put back", () => {
		const { added, removed } = diffImageUrls([`${S3}/banner.jpg`], [`${S3}/banner.jpg`]);

		expect(added).toEqual([]);
		expect(removed).toEqual([]);
	});

	it("treats a swap as one removal and one addition", () => {
		const { added, removed } = diffImageUrls([`${S3}/old.jpg`], [`${S3}/new.jpg`]);

		expect(added).toEqual([`${S3}/new.jpg`]);
		expect(removed).toEqual([`${S3}/old.jpg`]);
	});

	it("reports everything as removed when a record is emptied", () => {
		expect(diffImageUrls(["a", "b"], []).removed).toEqual(["a", "b"]);
	});
});
