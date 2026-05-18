import Fastify from "fastify";
import { prisma } from "./db/prisma.js";
const app = Fastify();

app.get("/health", async () => {
    return {status:"ok"};
});

app.get("/debug/friends", async () => {
   const friends = await prisma.friend.findMany();
   
   return {friends};
});



export default app;