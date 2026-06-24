import { describe, expect, it } from "vitest";
import { buildPredictionInput } from "../services/predictions.service.js";

describe("buildPredictionInput", () => {
  it("builds LLM assessment input from a friend and hypothetical action", () => {
    const friend = {
      id: "friend-1",
      displayName: "Cole",
      notes: "Likes warning before calls.",
      rules: [
        {
          id: "rule-1",
          title: "Unexpected calls are bad",
          description: "Cole dislikes being called without prior warning.",
          impactDirection: "negative",
          weight: "high",
        },
      ],
    };

    const result = buildPredictionInput(
      friend,
      "I call Cole without warning tomorrow."
    );

    expect(result).toEqual({
      friend: {
        id: "friend-1",
        displayName: "Cole",
        notes: "Likes warning before calls.",
      },
      event: {
        id: "hypothetical-event",
        eventText: "I call Cole without warning tomorrow.",
        happenedAt: null,
      },
      rules: [
        {
          id: "rule-1",
          title: "Unexpected calls are bad",
          description: "Cole dislikes being called without prior warning.",
          impactDirection: "negative",
          weight: "high",
        },
      ],
      retrievedContext: [],
    });
  });

  it("keeps retrieved document chunks in the LLM input", () => {
    const result = buildPredictionInput(
      {
        id: "friend-1",
        displayName: "Cole",
        notes: null,
        rules: [],
      },
      "I call Cole without warning tomorrow.",
      [
        {
          sourceType: "document_chunk",
          sourceId: "document-chunk-1",
          content: "Cole prefers scheduled calls.",
          score: 1,
        },
      ],
    );

    expect(result.retrievedContext).toEqual([
      {
        sourceType: "document_chunk",
        sourceId: "document-chunk-1",
        content: "Cole prefers scheduled calls.",
        score: 1,
      },
    ]);
  });
});
