import { z } from "zod";

export const createFriendBodySchema = z.object({
  displayName: z.string().trim().min(2).max(100),
  notes: z.string().trim().min(8).max(900).optional(),
  allowDuplicate: z.boolean().optional().default(false), //if allowDuplicate is true, we will allow creating a friend with the same display name as an existing friend. If it's false or not provided, we will check for existing friends with the same display name and return an error if one is found.
});

export type CreateFriendBody = z.infer<typeof createFriendBodySchema>;