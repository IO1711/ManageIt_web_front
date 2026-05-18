import { z } from "zod";

export const clientAccessRequestSchema = z.object({
  suggestedName: z
    .string()
    .trim()
    .min(1, "Suggested device name is required")
    .max(255, "Suggested device name must be 255 characters or fewer")
});
