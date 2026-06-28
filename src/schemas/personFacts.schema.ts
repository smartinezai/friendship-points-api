import { z } from "zod";

/** Trust and verification states supported for person facts. */
export const personFactVerificationStatusSchema = z.enum([
    "verified_self_declared",
    "unverified_third_party",
    "verified_by_target",
    "rejected_by_target",
    "corrected",
]);

/** Validates POST /friends/:friendId/facts request bodies. */
export const createPersonFactBodySchema = z.object({
    content: z
        .string()
        .trim()
        .min(2, "Fact content must be at least 2 characters long")
        .max(1000, "Fact content must be at most 1000 characters long"),
    sourceType: z.string().trim().min(1).max(100).optional().default("manual"),
    sourceId: z.string().trim().min(1).max(200).optional(),
});

export type PersonFactVerificationStatus = z.infer<
    typeof personFactVerificationStatusSchema
>;

export type CreatePersonFactBody = z.infer<
    typeof createPersonFactBodySchema
>;
