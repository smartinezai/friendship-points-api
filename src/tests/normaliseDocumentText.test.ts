import { describe, expect, it } from "vitest";
import { normaliseDocumentText } from "../services/documentIngestion/normaliseDocumentText.js";

describe("normaliseDocumentText", () => {
    it("converts Windows line endings to Unix line endings", () => {
        const result = normaliseDocumentText("Line one\r\nLine two\r\n");

        expect(result).toBe("Line one\nLine two");
    });

    it("trims leading and trailing document whitespace", () => {
        const result = normaliseDocumentText(
            "   Cole prefers planned calls.   ",
        );

        expect(result).toBe("Cole prefers planned calls.");
    });

    it("removes trailing whitespace from each line", () => {
        const result = normaliseDocumentText(
            "First line   \nSecond line\t\t\nThird line",
        );

        expect(result).toBe("First line\nSecond line\nThird line");
    });

    it("collapses three or more blank lines into one blank line", () => {
        const result = normaliseDocumentText(
            "First paragraph\n\n\n\nSecond paragraph",
        );

        expect(result).toBe("First paragraph\n\nSecond paragraph");
    });

    it("keeps Markdown structure intact", () => {
        const result = normaliseDocumentText(
            "## Communication\n\n- Cole dislikes unexpected calls.",
        );

        expect(result).toBe(
            "## Communication\n\n- Cole dislikes unexpected calls.",
        );
    });
});