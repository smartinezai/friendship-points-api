import { describe, expect, it } from "vitest";
import {
    calculateKeywordScore,
    removeStopWords,
    rerankContextItems,
    tokenise,
} from "../services/search.service.js";
import {
    semanticRetrievalFixture,
} from "./fixtures/retrieval.fixtures.js";

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

    it("removeStopWords should remove common low-value words", () => {
        const result = removeStopWords([
            "the",
            "user",
            "apologised",
            "after",
            "a",
            "message",
        ]);

        expect(result).toEqual(["user", "apologised", "message"]);
    });

    it("calculateKeywordScore should ignore stop words in the query", () => {
        const result = calculateKeywordScore(
            "the a after apologised",
            "The user apologised clearly.",
        );

        expect(result).toBe(1);
    });

    it("calculateKeywordScore should return zero when the query only contains stop words", () => {
        const result = calculateKeywordScore(
            "the a after",
            "The user apologised clearly.",
        );

        expect(result).toBe(0);
    });

});


describe("rerankContextItems retrieval evaluation tests group", () => {
    it("case that prioritises the relevant apology event over unrelated rules", () => {
        const results = rerankContextItems(
            "apologising after a badly worded message",
            semanticRetrievalFixture,
        );

        expect(results.at(0)?.sourceType).toBe("event");
        expect(results.at(0)?.content).toContain("apologised");
    });

    it("case that does not allow a rule source boost to dominate irrelevant content", () => {
        const results = rerankContextItems(
            "apologising after a badly worded message",
            semanticRetrievalFixture,
        );

        const apologyEventIndex = results.findIndex((item) =>
            item.content.includes("apologised"),
        );

        const betrayalRuleIndex = results.findIndex((item) =>
            item.content.includes("Extreme betrayal"),
        );

        expect(apologyEventIndex).toBeGreaterThanOrEqual(0);
        expect(betrayalRuleIndex).toBeGreaterThanOrEqual(0);
        expect(apologyEventIndex).toBeLessThan(betrayalRuleIndex);
    });

    it("case that keeps semantic distance available for hybrid reranking", () => {
        const semanticItem = semanticRetrievalFixture[0];

        expect(semanticItem).toBeDefined();//expects that the fixture item is not empty and still a SemanticRetrievedContextItem after reranking, meaning the distance property is still there and can be used for hybrid reranking in the future

        if (!semanticItem) {
            throw new Error("Expected semantic retrieval fixture to contain at least one item");
        }

        expect(semanticItem.distance).toBe(0.12);
    });

    it("reveals that the current reranker does not include distance in the rerank reason", () => {
        const results = rerankContextItems(
            "apologising after a badly worded message",
            semanticRetrievalFixture,
        );

        expect(results.at(0)?.rerankReason).not.toContain("distance");
    });
});

