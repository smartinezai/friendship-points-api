/** Valid values for the direction a rule moves a friendship score. */
export const IMPACT_DIRECTIONS = [
    "positive",
    "negative",
    "neutral",
    "mixed",
] as const;

/** Valid rule weights ordered from the least to the greatest impact. */
export const RULE_WEIGHTS = [
    "minimal",
    "low",
    "medium",
    "high",
    "critical",
    "extreme",
] as const;

export type ImpactDirection = (typeof IMPACT_DIRECTIONS)[number];
export type RuleWeight = (typeof RULE_WEIGHTS)[number];
