import { ChatMistralAI } from "@langchain/mistralai";
import { createFriendContextAgent } from "./friendContext.agent.js";

const productionModel = new ChatMistralAI({
    model: "mistral-small-latest",
    temperature: 0,
});

export const friendContextAgent =
    createFriendContextAgent(productionModel);