export type LlmRetrievedContextItem = {
  sourceType: "friend_note" | "rule" | "event";
  sourceId: string;
  content: string;
  score: number;
};

export type LlmAssessmentInput = {
  friend: {
    id: string;
    displayName: string;
    notes: string | null; //either string or null because the Prisma schema allows for nullable strings
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


export type LlmAssessmentResult = {
    impactDirection: "positive" | "negative" | "neutral" | "mixed";
    scoreDelta: number;
    confidence: number;
    reasoningSummary: string;
    matchedRuleIds: string[];
    biasNotes?: string;
};
