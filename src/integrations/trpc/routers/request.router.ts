import type { TRPCRouterRecord } from "@trpc/server";
import { prisma } from "@/lib/prisma";
import { protectedProcedure } from "../init";

/**
 * Issue the next document number for the current year, as `YYYY-NNNN`.
 *
 * The upsert and the increment are one statement inside a transaction, never a
 * read-then-write: two people submitting in the same second must come out with
 * two different numbers, and a `findUnique` followed by an `update` gives them
 * the same one. The upsert also covers the year rollover for free - January's
 * first submit creates that year's row with `lastSequence: 1`.
 *
 * Exported as a plain helper as well as a procedure, because `request.submit`
 * calls it inline rather than over the wire.
 */
export async function generateDocumentNumber(): Promise<string> {
	const year = new Date().getFullYear();

	const sequence = await prisma.$transaction(async (tx) =>
		tx.documentSequence.upsert({
			where: { year },
			create: { year, lastSequence: 1 },
			update: { lastSequence: { increment: 1 } },
		}),
	);

	const padded = String(sequence.lastSequence).padStart(4, "0");
	return `${year}-${padded}`;
}

export const requestRouter = {
	generateDocumentNumber: protectedProcedure.mutation(async () => {
		const documentNumber = await generateDocumentNumber();
		return { documentNumber };
	}),
} satisfies TRPCRouterRecord;
