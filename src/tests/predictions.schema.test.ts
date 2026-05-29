import { describe, expect, it } from "vitest";
import { predictFriendActionBodySchema } from "../schemas/predictions.schema.js";

describe("predictFriendActionBodySchema tests", () => {
  it("test case that accepts a valid hypothetical action", () => {
    const result = predictFriendActionBodySchema.safeParse({
      hypotheticalAction: "I call Cole without warning tomorrow.",
    });

    expect(result.success).toBe(true);
  });

  it("test case that rejects a hypothetical action that is too short", () => {
    const result = predictFriendActionBodySchema.safeParse({
      hypotheticalAction: "bad",
    });

    expect(result.success).toBe(false);
  });

  it("test case that rejects a missing hypothetical action", () => {
    const result = predictFriendActionBodySchema.safeParse({});

    expect(result.success).toBe(false);
  });
});