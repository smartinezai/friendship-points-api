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

app.post("/debug/friends/cole", async () => {
  const friend = await prisma.friend.create({
    data: {
      displayName: "Cole William Bailey",
      notes: "Best friend, piece of shit.",
    },
  });

  return { friend };
});

export default app;