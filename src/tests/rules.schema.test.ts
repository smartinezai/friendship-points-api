import { describe, expect, it } from "vitest";
import {
  createRuleBodySchema,
  updateRuleWeightBodySchema,
} from "../schemas/rules.schema.js";

describe("createRuleBodySchema", () => {
  it("accepts a valid rule creation body", () => {
    const result = createRuleBodySchema.safeParse({
      title: "No unexpected calls",
      description: "I dislike when my friend calls me without warning.",
      impactDirection: "negative",
      weight: "high",
    });

    expect(result.success).toBe(true);
  });

  it("accepts extreme as a valid rule weight", () => {
    const result = createRuleBodySchema.safeParse({
      title: "Major betrayal",
      description: "A very serious violation of trust.",
      impactDirection: "negative",
      weight: "extreme",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid impact direction", () => {
    const result = createRuleBodySchema.safeParse({
      title: "No unexpected calls",
      description: "I dislike when my friend calls me without warning.",
      impactDirection: "bad",
      weight: "high",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid rule weight", () => {
    const result = createRuleBodySchema.safeParse({
      title: "No unexpected calls",
      description: "I dislike when my friend calls me without warning.",
      impactDirection: "negative",
      weight: "huge",
    });

    expect(result.success).toBe(false);
  });
});

describe("updateRuleWeightBodySchema", () => {
  it("accepts a valid rule weight update", () => {
    const result = updateRuleWeightBodySchema.safeParse({
      weight: "critical",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid rule weight update", () => {
    const result = updateRuleWeightBodySchema.safeParse({
      weight: "huge",
    });

    expect(result.success).toBe(false);
  });
});