import { describe, expect, it } from "vitest";
import {
    createPersonFactBodySchema,
    personFactVerificationStatusSchema,
} from "../schemas/personFacts.schema.js";

describe("personFactVerificationStatusSchema", () => {
    it("accepts the supported verification statuses", () => {
        expect(
            personFactVerificationStatusSchema.safeParse(
                "verified_self_declared",
            ).success,
        ).toBe(true);
        expect(
            personFactVerificationStatusSchema.safeParse(
                "unverified_third_party",
            ).success,
        ).toBe(true);
    });

    it("rejects unsupported verification statuses", () => {
        const result = personFactVerificationStatusSchema.safeParse("rumor");

        expect(result.success).toBe(false);
    });
});

describe("createPersonFactBodySchema", () => {
    it("accepts a valid manually sourced fact body", () => {
        const result = createPersonFactBodySchema.safeParse({
            content: "  Cole prefers planned calls.  ",
        });

        expect(result.success).toBe(true);

        if (result.success) {
            expect(result.data).toEqual({
                content: "Cole prefers planned calls.",
                sourceType: "manual",
            });
        }
    });

    it("accepts optional source metadata", () => {
        const result = createPersonFactBodySchema.safeParse({
            content: "Cole filled out a communication preferences form.",
            sourceType: "intake_form",
            sourceId: "form-response-1",
        });

        expect(result.success).toBe(true);
    });

    it("rejects empty fact content", () => {
        const result = createPersonFactBodySchema.safeParse({
            content: "",
        });

        expect(result.success).toBe(false);
    });
});
