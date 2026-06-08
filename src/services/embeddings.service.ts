import { prisma } from "../db/prisma.js";

const MISTRAL_EMBEDDING_MODEL = "mistral-embed";

function formatVectorForSql(embedding: number[]): string {
    return `[${embedding.join(",")}]`;
}

export async function updateSearchableDocumentEmbedding(
    searchableDocumentId: string,
    embedding: number[],
): Promise<void> {
    await prisma.$executeRaw`
    UPDATE "SearchableDocument"
    SET "embedding" = ${formatVectorForSql(embedding)}::vector
    WHERE "id" = ${searchableDocumentId}
  `;
}

/**
 * MistralEmbeddingResponse is an object with one key called data.

data is an array.

Each item inside the data array is an object.

Each object has a key called embedding.

embedding is an array of numbers.
 */
type MistralEmbeddingResponse = {
    data: {
        embedding: number[];
    }[];
};

export async function createEmbedding(text: string): Promise<number[]> {
    const apiKey = process.env.MISTRAL_API_KEY;

    if (!apiKey) {
        throw new Error("Mistral API key is not set in environment variables");
    }

    const response = await fetch("https://api.mistral.ai/v1/embeddings", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: MISTRAL_EMBEDDING_MODEL,
            input: text,
        }),
    });

    if (!response.ok) {
        throw new Error(`Mistral embedding request failed: ${response.status}.`);
    }

    const data = (await response.json()) as MistralEmbeddingResponse;
    /**
     * Read the JSON response.
    Treat it as a MistralEmbeddingResponse object.
    Store it in data.
     */

    const embedding = data.data[0]?.embedding; //get first embedding from the data array

    if (!embedding) {
        throw new Error("Mistral embedding response is missing embedding data");
    }

    if (embedding.length !== 1024) {
        throw new Error(`Expected embedding dimension 1024, got ${embedding.length}.`);
    }

    return embedding;
}


export async function embedSearchableDocumentsWithoutEmbeddings(): Promise<{
    embeddedCount: number;
}> {
    const documents = await prisma.$queryRaw<
        { id: string; content: string }[]
    >`
    SELECT "id", "content"
    FROM "SearchableDocument"
    WHERE "embedding" IS NULL
  `;

    let embeddedCount = 0;

    for (const document of documents) {
        const embedding = await createEmbedding(document.content);

        await updateSearchableDocumentEmbedding(
            document.id,
            embedding,
        );

        embeddedCount += 1;
    }

    return { embeddedCount };
}