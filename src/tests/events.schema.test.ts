import { describe, expect, it } from "vitest";
import { createEventBodySchema } from "../schemas/events.schema.js";

describe("createEventBodySchema tests", () => {
  it("test case that accepts a valid event body with happenedAt", () => {
    const result = createEventBodySchema.safeParse({
      eventText: "Cole helped me debug my API route validation.",
      happenedAt: "2026-05-26T11:30:00.000Z",
    });

    expect(result.success).toBe(true);
  });

  it("test case that accepts a valid event body without happenedAt", () => {
    const result = createEventBodySchema.safeParse({
      eventText: "Cole helped me debug my API route validation.",
    });

    expect(result.success).toBe(true);
  });

  it("test case that rejects event text that is too short", () => {
    const result = createEventBodySchema.safeParse({
      eventText: "bad",
    });

    expect(result.success).toBe(false);
  });

  it("test case that rejects an invalid happenedAt value", () => {
    const result = createEventBodySchema.safeParse({
      eventText: "Cole helped me debug my API route validation.",
      happenedAt: "not-a-date",
    });

    expect(result.success).toBe(false);
  });
});