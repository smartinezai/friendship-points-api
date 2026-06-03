import "dotenv/config";
import app from "./app.js";
import { logError } from "./utils/logging.js";

const port = Number(process.env.PORT) || 3000;

/** Starts the HTTP server and logs startup failures before exiting. */
async function start() {
    try{
        await app.listen({
            port,
            host: "0.0.0.0",
        });
        console.log(`Server is running on port ${port}`);        
    } catch (error) {
        logError("Error starting the server", error);
        process.exit(1);
    }
}

start();
