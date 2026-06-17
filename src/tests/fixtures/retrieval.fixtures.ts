import type {
    RerankedContextItem,
    SemanticRetrievedContextItem,
} from "../../services/search.service.js";





export const retrievalTestFriendId =
    "5da77ede-2290-4ede-9839-d83a29a310e6";



export const semanticRetrievalFixtureWithInvalidSourceId:
    SemanticRetrievedContextItem[] = [
        {
            sourceType: "event",
            sourceId: "",
            friendId: retrievalTestFriendId,
            content:
                "Malformed event context that should not be returned because it has no source ID.",
            score: 0,
            distance: 0.05,
        },
        {
            sourceType: "event",
            sourceId: "44444444-4444-4444-8444-444444444444",
            friendId: retrievalTestFriendId,
            content:
                "Valid event context that can be traced back to its source record.",
            score: 0,
            distance: 0.1,
        },
    ];

/**
* A fixture is reusable test data.
*
* Instead of writing the same fake friend ID, fake event, fake rule, and fake
* search result inside many tests, controlled data lives in one file and can be
* imported where needed.
*/
export const semanticRetrievalFixture: SemanticRetrievedContextItem[] = [
    {
        sourceType: "event",
        sourceId: "11111111-1111-4111-8111-111111111111",
        friendId: retrievalTestFriendId,
        content:
            "The user apologised after sending a badly worded message and clarified their intent.",
        score: 0,
        distance: 0.12,
    },
    {
        sourceType: "rule",
        sourceId: "22222222-2222-4222-8222-222222222222",
        friendId: retrievalTestFriendId,
        content:
            "Extreme betrayal is a serious violation of trust reserved for rare cases.",
        score: 0,
        distance: 0.38,
    },
    {
        sourceType: "rule",
        sourceId: "33333333-3333-4333-8333-333333333333",
        friendId: retrievalTestFriendId,
        content:
            "Unexpected calls are bad because Cole dislikes calls without warning.",
        score: 0,
        distance: 0.36,
    },
    {
        sourceType: "friend_note",
        sourceId: retrievalTestFriendId,
        friendId: retrievalTestFriendId,
        content:
            "Cole is the user's best friend and often responds positively to honest repair attempts.",
        score: 0,
        distance: 0.22,
    },
];

export const rerankedRetrievalFixture: RerankedContextItem[] = [
    {
        sourceType: "event",
        sourceId: "11111111-1111-4111-8111-111111111111",
        friendId: retrievalTestFriendId,
        content:
            "The user apologised after sending a badly worded message and clarified their intent.",
        score: 0,
        rerankScore: 5,
        rerankReason: "Controlled fixture",
    },
];