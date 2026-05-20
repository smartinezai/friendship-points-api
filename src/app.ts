import Fastify from "fastify";
import {friendRoutes} from "./routes/friends.routes.js";
import {ruleRoutes} from "./routes/rules.routes.js";
import { eventRoutes } from "./routes/events.routes.js";
const app = Fastify();

app.get("/health", async () => {
    return {status:"ok"};
});

app.register(friendRoutes); //register the friend routes with the Fastify instance
app.register(ruleRoutes); //register the rule routes with the Fastify instance
app.register(eventRoutes); //register the event routes with the Fastify instance
export default app;