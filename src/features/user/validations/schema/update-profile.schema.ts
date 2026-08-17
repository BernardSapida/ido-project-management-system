import { z } from "zod";

export const UpdateProfileSchema = z.object({
	firstname: z.string().min(2, "First name must be at least 2 characters").max(50),
	lastname: z.string().min(2, "Last name must be at least 2 characters").max(50),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
