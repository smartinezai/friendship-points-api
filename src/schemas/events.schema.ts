import { z } from "zod";

export const createEventBodySchema = z.object({
    eventText: z.string()
        .trim()
        .min(10, "Event text must be at least 10 characters long")
        .max(2000, "Event text must be at most 2000 characters long"),
    happenedAt: z.iso.datetime().optional(), //validate that happenedAt is a valid ISO datetime string, and make it optional
});

export type CreateEventBody = z.infer<typeof createEventBodySchema>;