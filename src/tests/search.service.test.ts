import { describe, expect, it } from "vitest";
import { calculateKeywordScore, tokenise } from "../services/search.service.js";


describe("search service tests", () => {
    it("tokenise should split text into lowercase tokens", () => {
        const result = tokenise("Cole, called-without warning!");

        expect(result).toEqual(["cole", "called", "without", "warning"]);
    });

    it("calculateKeywordScore should return correct score using unique matching query tokens", () => {
        const result = calculateKeywordScore(
           "Cole Cole without warning",
            "Cole dislikes unexpected phone calls.",
        );

        expect(result).toBe(1);
    });

    it("calculateKeywordScore should return zero when there are no matching tokens", () => {
        const result = calculateKeywordScore(
            "unexpected phone calls",
            "Cole likes fries.",
        );

        expect(result).toBe(0);
    });

    it("calculateKeywordScore should count multiple matching tokens only once", () => {
        const result = calculateKeywordScore(
            "unexpected phone call",
            "Unexpected phone calls are sressful.",
        );
        expect(result).toBe(2);
    });
});


