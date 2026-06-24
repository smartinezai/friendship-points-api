import type { SearchableSourceType } from "../services/search.service.js";

/** Context item retrieved from the search index for RAG prompts. */
export type LlmRetrievedContextItem = {
  sourceType: SearchableSourceType;
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
