import { describe, expect, it } from "vitest";
import { formatSourceCitation } from "../ai/tools/sourceCitation.js";

describe("formatSourceCitation", () => {
    it("formats source type and source ID as an agent citation", () => {
        const citation = formatSourceCitation(
            "event",
            "aa4e0523-356c-4db5-99f5-ef0d39ffc863",
        );

        expect(citation).toBe(
            "[event: aa4e0523-356c-4db5-99f5-ef0d39ffc863]",
        );
    });
});