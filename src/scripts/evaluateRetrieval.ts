import "dotenv/config";
import {
    rerankContextItems,
    retrieveFriendContextSemantically,
} from "../services/search.service.js";

const friendId = "5da77ede-2290-4ede-9839-d83a29a310e6";

const evaluationQueries = [
    {
        label: "Apology after badly worded message",
        query: "apologising after a misunderstood or badly worded message",
    },
    {
        label: "Unexpected phone call",
        query: "unexpected phone call without warning",
    },
    {
        label: "Friendship repair",
        query: "repairing communication after upsetting Cole",
    },
    {
        label: "English query for Spanish apology context",
        query: "apologising after a message came across badly",
    },
    {
        label: "Spanish query for apology context",
        query: "disculparse después de que un mensaje sonó mal",
    },
    {
        label: "Spanish query for unexpected call context",
        query: "llamada inesperada sin avisar",
    },
    {
        label: "No-match query: airport luggage",
        query: "lost luggage at the airport",
    },
    {
        label: "No-match query: dentist appointment",
        query: "dentist appointment rescheduling",
    },
    {
        label: "Weak-match query: financial emergency",
        query: "urgent financial help during a crisis",
    },
];

async function main(): Promise<void> {
    for (const evaluationQuery of evaluationQueries) {
        console.log(`\n=== ${evaluationQuery.label} ===`);
        console.log(`Query: ${evaluationQuery.query}`);

        const semanticResults = await retrieveFriendContextSemantically(
            friendId,
            evaluationQuery.query,
            {
                limit: 10,
            },
        );

        const rerankedResults = rerankContextItems(
            evaluationQuery.query,
            semanticResults,
        ).slice(0, 5);

        console.dir(
            rerankedResults.map((result) => ({
                sourceType: result.sourceType,
                sourceId: result.sourceId,
                distance: "distance" in result ? result.distance : undefined,
                rerankScore: result.rerankScore,
                rerankReason: result.rerankReason,
                content: result.content,
            })),
            { depth: null },
        );
    }
}

main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
});