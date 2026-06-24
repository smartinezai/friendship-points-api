import "dotenv/config";
import { prisma } from "../db/prisma.js";
import { DOCUMENT_CHUNK_SOURCE_TYPE } from "../services/documentIngestion/documentSourceTypes.js";
import { ingestFriendDocument } from "../services/documentIngestion/ingestFriendDocument.service.js";

const friendId = "5da77ede-2290-4ede-9839-d83a29a310e6";

/**
 * Runs a manual smoke test for document ingestion.
 *
 * This script writes a small Markdown document into the existing
 * SearchableDocument table, then reads the created rows back by their generated
 * source IDs. It is manual because it touches the real development database.
 */
async function main(): Promise<void> {
    const result = await ingestFriendDocument({
        friendId,
        title: "Cole communication notes",
        documentType: "markdown",
        content: [
            "## Communication",
            "",
            "Cole prefers planned calls over unexpected calls.",
            "",
            "Unexpected calls can feel disruptive unless there is an emergency.",
        ].join("\n"),
        maxChunkCharacters: 1500,
    });

    const createdDocuments = await prisma.searchableDocument.findMany({
        where: {
            friendId,
            sourceType: DOCUMENT_CHUNK_SOURCE_TYPE,
            sourceId: {
                in: result.sourceIds,
            },
        },
        orderBy: {
            createdAt: "asc",
        },
    });

    console.log("Ingestion result:");
    console.dir(result, { depth: null });

    console.log("\nCreated searchable documents:");
    console.dir(createdDocuments, { depth: null });

    if (createdDocuments.length !== result.createdChunkCount) {
        throw new Error(
            `Expected ${result.createdChunkCount} searchable documents, found ${createdDocuments.length}`,
        );
    }
}

main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
});