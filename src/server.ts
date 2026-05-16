import Fastify from "fastify";

const app = Fastify();

app.get("/health", async () => {
    return {status:"ok"};
});


export default app;