import { describe, expect, it } from "vitest";
import { createFriendBodySchema } from "../schemas/friends.schema.js";

describe("createFriendBodySchema tests", () => {
  it("test case that accepts a valid friend creation body", () => {
    const result = createFriendBodySchema.safeParse({
      displayName: "Cole",
      notes: "Likes warning before calls.",
    });

    expect(result.success).toBe(true);
  });

  it("test case that accepts allowDuplicate as true", () => {
    const result = createFriendBodySchema.safeParse({
      displayName: "Cole",
      allowDuplicate: true,
    });

    expect(result.success).toBe(true);
  });

  it("test case that defaults allowDuplicate to false", () => {
    const result = createFriendBodySchema.safeParse({
      displayName: "Cole",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.allowDuplicate).toBe(false);
    }
  });

  it("test case that rejects an empty displayName", () => {
    const result = createFriendBodySchema.safeParse({
      displayName: "",
    });

    expect(result.success).toBe(false);
  });

  it("test case that rejects a displayName that is too short after trimming", () => {
    const result = createFriendBodySchema.safeParse({
      displayName: " A ",
    });

    expect(result.success).toBe(false);
  });
});