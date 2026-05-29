import { describe, expect, it } from "vitest";
import { manualAssessmentBodySchema } from "../schemas/assessments.schema.js";

describe("manualAssessmentBodySchema tests", () => {
  it("test case that accepts a valid manual assessment", () => {
    const result = manualAssessmentBodySchema.safeParse({
      scoreDelta: -3.5,
      reason: "This is a valid manual reason.",
    });

    expect(result.success).toBe(true);
  });

  it("test case that accepts a manual assessment without a reason", () => {
    const result = manualAssessmentBodySchema.safeParse({
      scoreDelta: 2,
    });

    expect(result.success).toBe(true);
  });

  it("test case that rejects scoreDelta below -10", () => {
    const result = manualAssessmentBodySchema.safeParse({
      scoreDelta: -99,
      reason: "This score is too low.",
    });

    expect(result.success).toBe(false);
  });

  it("rejects scoreDelta above 10", () => {
    const result = manualAssessmentBodySchema.safeParse({
      scoreDelta: 99,
      reason: "This score is too high.",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a reason that is too short", () => {
    const result = manualAssessmentBodySchema.safeParse({
      scoreDelta: 1,
      reason: "bad",
    });

    expect(result.success).toBe(false);
  });
});