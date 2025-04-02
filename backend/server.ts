import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import MemMongoTaskRepo from './repos/mem.mongo.task.repo';
import TaskController from "./controllers/task.controller";
import loggingMiddleware from "./middleware/logging.middleware";
import TaskRoutes from "./router/task.routes";

async function startServer() {
    const app: Express = express();
    app.use(cors());
    app.use(express.json());

    app.use(loggingMiddleware);

    const { repo: taskRepository, mongoServer, client } = await MemMongoTaskRepo.startMongoDB();
    const taskController = new TaskController(taskRepository);
    const taskRoutes = new TaskRoutes(taskController);
    app.use(taskRoutes.router);

    // --- Server Startup ---
    const port = 5000;
    const server = app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });

    // --- Graceful Shutdown ---
    process.on('SIGINT', async () => {
        console.log('Received SIGINT. Shutting down...');
        try {
            await MemMongoTaskRepo.shutdownMongoDB(client, mongoServer);
            console.log('MongoDB server and client connection closed.');
        } catch (err) {
            console.error('Error during shutdown:', err);
        } finally {
            server.close(() => {
                console.log('Express server closed.');
                process.exit();
            });
        }
    });
}

startServer();