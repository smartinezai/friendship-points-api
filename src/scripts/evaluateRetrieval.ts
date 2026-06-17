import "dotenv/config";
import {
    rerankContextItems,
    retrieveFriendContextSemantically,
} from "../services/search.service.js";

const friendId = "5da77ede-2290-4ede-9839-d83a29a310e6";

type EvaluationQuery = {
    label: string;
    query: string;
    /**
     * Source IDs that should appear in the top reranked results for known-positive queries.
     * Omit this for no-match or exploratory queries.
     */
    expectedSourceIds?: string[];
};

type EvaluationSummary = {
    totalQueries: number;
    queriesWithExpectedSources: number;
    expectedInTopFive: number;
    expectedAtRankOne: number;
    exploratoryQueries: number;
};

const evaluationQueries: EvaluationQuery[] = [
    {
        label: "Apology after badly worded message",
        query: "apologising after a misunderstood or badly worded message",
        expectedSourceIds: ["aa4e0523-356c-4db5-99f5-ef0d39ffc863"],
    },
    {
        label: "Unexpected phone call",
        query: "unexpected phone call without warning",
        expectedSourceIds: ["451fa48b-43d7-444f-8fd4-668136a564a0"],
    },
    {
        label: "Friendship repair",
        query: "repairing communication after upsetting Cole",
        expectedSourceIds: ["aa4e0523-356c-4db5-99f5-ef0d39ffc863"],
    },
    {
        label: "Spanish query for apology context",
        query: "disculparse después de que un mensaje sonó mal",
        expectedSourceIds: ["aa4e0523-356c-4db5-99f5-ef0d39ffc863"],
    },
    {
        label: "Spanish query for unexpected call context",
        query: "llamada inesperada sin avisar",
        expectedSourceIds: ["451fa48b-43d7-444f-8fd4-668136a564a0"],
    },
    {
        label: "English query for Spanish apology context",
        query: "apologising after a message came across badly",
        expectedSourceIds: ["aa4e0523-356c-4db5-99f5-ef0d39ffc863"],
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
    const summary: EvaluationSummary = {
        totalQueries: evaluationQueries.length,
        queriesWithExpectedSources: 0,
        expectedInTopFive: 0,
        expectedAtRankOne: 0,
        exploratoryQueries: 0,
    };

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

        const returnedSourceIds = rerankedResults.map(
            (result) => result.sourceId,
        );

        if (evaluationQuery.expectedSourceIds) {
            summary.queriesWithExpectedSources += 1;

            const expectedInTopFive =
                evaluationQuery.expectedSourceIds.some((sourceId) =>
                    returnedSourceIds.includes(sourceId),
                );

            const expectedAtTop =
                evaluationQuery.expectedSourceIds.includes(
                    rerankedResults.at(0)?.sourceId ?? "",
                );

            if (expectedInTopFive) {
                summary.expectedInTopFive += 1;
            }

            if (expectedAtTop) {
                summary.expectedAtRankOne += 1;
            }

            console.log(`Expected result in top 5: ${expectedInTopFive}`);
            console.log(`Expected result at rank 1: ${expectedAtTop}`);
        } else {
            summary.exploratoryQueries += 1;
            console.log("No expected source ID configured for this query.");
        }

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
    console.log("\n=== Retrieval evaluation summary ===");
    console.log(`Queries evaluated: ${summary.totalQueries}`);
    console.log(
        `Queries with expected source IDs: ${summary.queriesWithExpectedSources}`,
    );
    console.log(
        `Expected results in top 5: ${summary.expectedInTopFive}/${summary.queriesWithExpectedSources}`,
    );
    console.log(
        `Expected results at rank 1: ${summary.expectedAtRankOne}/${summary.queriesWithExpectedSources}`,
    );
    console.log(`Exploratory/no-match queries: ${summary.exploratoryQueries}`);
}

main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
});