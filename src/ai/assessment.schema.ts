import { z } from "zod"; //use zod to define a schema for validating the request body when creating a manual assessment. This schema ensures that the scoreDelta is a number between -10 and 10, and that the reason (if provided) is a string with a reasonable length. By defining this schema, we can easily validate incoming requests and provide clear error messages if the data does not meet our requirements.

//use zod to check that the LLM output matches the expected structure defined in the LlmAssessmentResult type. This helps ensure that the data we receive from the LLM is in the correct format and contains all the necessary fields before we attempt to use it in our application.
export const assessmentSchema = z.object({
    scoreDelta: z.number().min(-10).max(10),
    impactDirection: z.enum(["positive", "negative", "neutral", "mixed"]),
    confidence: z.number().min(0).max(1),
    reasoningSummary: z.string().trim().min(10).max(500),
    matchedRuleIds: z.array(z.string()),
    biasNotes: z.string().trim().min(10).max(500).optional()
});
//use export to create a TypeScript type called AssessmentInput that is inferred from the assessmentSchema defined above. This allows us to have strong typing for our assessment input data throughout our codebase, ensuring that we are working with correctly structured data and reducing the likelihood of runtime errors.
export type LlmAssessmentResult = z.infer<typeof assessmentSchema>; //This line uses the zod library to infer a TypeScript type from the defined schema. By using z.infer, we can automatically generate a TypeScript type that corresponds to the structure and validation rules defined in the assessmentSchema. This allows us to have strong typing for our assessment input data throughout our codebase, ensuring that we are working with correctly structured data and reducing the likelihood of runtime errors.
