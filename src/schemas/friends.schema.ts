import { z } from "zod";

/** Validates POST /friends request bodies. */
export const createFriendBodySchema = z.object({
  displayName: z.string().trim().min(2).max(100),
  notes: z.string().trim().min(8).max(900).optional(),
  // Callers must opt in before creating two active friends with the same name.
  allowDuplicate: z.boolean().optional().default(false),
});

const updateFriendFieldsSchema = z.object({
  displayName: z.string().trim().min(2).max(100).optional(),
  notes: z.string().trim().min(2).max(1000).nullable().optional(),
});

/** Validates PATCH /friends/:id and requires at least one editable field. */
export const updateFriendBodySchema = updateFriendFieldsSchema.refine(
  (data) => data.displayName !== undefined || data.notes !== undefined,
  {
    message: "At least one field must be provided",
  }
);

/** Validates POST /friends/:id/notes/append request bodies. */
export const appendFriendNoteBodySchema = z.object({
  note: z
    .string()
    .trim()
    .min(2, "Note must be at least 2 characters long")
    .max(1000, "Note must be at most 1000 characters long"),
});

export type CreateFriendBody = z.infer<typeof createFriendBodySchema>;
export type UpdateFriendBody = z.infer<typeof updateFriendBodySchema>;
export type AppendFriendNoteBody = z.infer<typeof appendFriendNoteBodySchema>;
