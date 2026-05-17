import "dotenv/config";
import app from "./app.js";
import { prisma } from "./db/prisma.js";

const port = Number(process.env.PORT) || 3000; // if for some reason the port is missing from .env, default to 3000

async function start() {
    try{
        await app.listen({
            port,
            host: "0.0.0.0",
        });
        console.log(`Server is running on port ${port}`);        
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

start();
