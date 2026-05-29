import { describe, expect, it } from "vitest";
import { 
    createFriendBodySchema,
    updateFriendBodySchema,
    appendFriendNoteBodySchema,
 } from "../schemas/friends.schema.js";



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


describe("updateFriendBodySchema", () => {
  it("accepts updating displayName only", () => {
    const result = updateFriendBodySchema.safeParse({
      displayName: "Cole Updated",
    });

    expect(result.success).toBe(true);
  });

  it("accepts updating notes only", () => {
    const result = updateFriendBodySchema.safeParse({
      notes: "Updated notes for Cole.",
    });

    expect(result.success).toBe(true);
  });

  it("accepts clearing notes with null", () => {
    const result = updateFriendBodySchema.safeParse({
      notes: null,
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty update body", () => {
    const result = updateFriendBodySchema.safeParse({});

    expect(result.success).toBe(false);
  });
});

describe("appendFriendNoteBodySchema", () => {
  it("accepts a valid note append body", () => {
    const result = appendFriendNoteBodySchema.safeParse({
      note: "Cole likes clear planning before calls.",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty note", () => {
    const result = appendFriendNoteBodySchema.safeParse({
      note: "",
    });

    expect(result.success).toBe(false);
  });
});