import { z } from "zod";

/**
 * Supported document types for the first document-ingestion version.
 *
 * Day 34 starts with plain text and Markdown because both can be processed
 * without complex parsing libraries. PDF, DOCX, and CSV can be added later
 * after the basic ingestion flow is stable.
 */
export const supportedDocumentTypeSchema = z.enum(["txt", "markdown"]);

/**
 * Validates the request body for document ingestion.
 *
 * This schema accepts raw document text directly in the API request. That keeps
 * the first implementation simple: no file uploads, no multipart parsing, and
 * no external storage yet.
 */
export const ingestDocumentBodySchema = z.object({
    title: z.string().trim().min(1),
    documentType: supportedDocumentTypeSchema,
    content: z.string().trim().min(1),
    sourceDate: z.coerce.date().optional(),
});

/**
 * Validates the route params for friend-specific document ingestion.
 *
 * The first version attaches documents to a friend because the existing RAG
 * system is still friend-scoped.
 */
export const ingestFriendDocumentParamsSchema = z.object({
    friendId: z.uuid(),
});

export type SupportedDocumentType = z.infer<
    typeof supportedDocumentTypeSchema
>;

export type IngestDocumentBody = z.infer<typeof ingestDocumentBodySchema>;

export type IngestFriendDocumentParams = z.infer<
    typeof ingestFriendDocumentParamsSchema
>;