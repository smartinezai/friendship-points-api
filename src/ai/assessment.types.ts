/** Context item retrieved from the search index for RAG prompts. */
export type LlmRetrievedContextItem = {
  sourceType: "friend_note" | "rule" | "event";
  sourceId: string;
  content: string;
  score: number;
};

/** Provider-agnostic input passed to mock, Mistral, and OpenAI assessment flows. */
export type LlmAssessmentInput = {
  friend: {
    id: string;
    displayName: string;
    notes: string | null;
  };
  event: {
    id: string;
    eventText: string;
    happenedAt?: string | null;
  };
  rules: {
    id: string;
    title: string;
    description: string;
    impactDirection: string;
    weight: string;
  }[];
  retrievedContext?: LlmRetrievedContextItem[];
};
