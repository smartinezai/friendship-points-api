import { z } from "zod";

export const createFriendBodySchema = z.object({
  displayName: z.string().trim().min(2).max(100),
  notes: z.string().trim().min(8).max(900).optional(),
  allowDuplicate: z.boolean().optional().default(false), //if allowDuplicate is true, we will allow creating a friend with the same display name as an existing friend. If it's false or not provided, we will check for existing friends with the same display name and return an error if one is found.
});

const updateFriendFieldsSchema = z.object({
  displayName: z.string().trim().min(2).max(100).optional(),
  notes: z.string().trim().min(2).max(1000).nullable().optional(),
});

export const updateFriendBodySchema = updateFriendFieldsSchema.refine(
  (data) => data.displayName !== undefined || data.notes !== undefined,//a function that takes data as an argument and returns true if at least one of the fields is provided, and false if neither field is provided
  { //remember that !== undefined means that the field is provided, even if it's null or an empty string. We just want to make sure that at least one of the fields is included in the request body.
    message: "At least one field must be provided",
  }
);

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