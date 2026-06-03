import Fastify from "fastify";
import {friendRoutes} from "./routes/friends.routes.js";
import {ruleRoutes} from "./routes/rules.routes.js";
import { eventRoutes } from "./routes/events.routes.js";
import { assessmentRoutes } from "./routes/assessments.routes.js";
import { predictionRoutes } from "./routes/predictions.routes.js";

/** Fastify app instance with all route modules registered. */
const app = Fastify();

app.get("/health", async () => {
    return {status:"ok"};
});

app.register(friendRoutes);
app.register(ruleRoutes);
app.register(eventRoutes);
app.register(assessmentRoutes);
app.register(predictionRoutes);
export default app;
