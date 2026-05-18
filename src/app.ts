import Fastify from "fastify";
import {friendRoutes} from "./routes/friends.routes.js";
const app = Fastify();

app.get("/health", async () => {
    return {status:"ok"};
});

app.register(friendRoutes); //register the friend routes with the Fastify instance


export default app;