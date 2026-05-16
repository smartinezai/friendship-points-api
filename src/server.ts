import app from "./app";

const port = 3000;

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
};

start();
