/** Low temperature keeps scoring more stable across repeated LLM calls. */
export const LLM_TEMPERATURE = 0.2;

/** Increment when prompt instructions change in a way that affects outputs. */
export const PROMPT_VERSION = "friendship-assessment-v1";

/** Central model selection for assessment and prediction providers. */
export const LLM_MODELS = {
    openAi: "gpt-4o-mini",
    mistral: "mistral-tiny-latest",
} as const;
