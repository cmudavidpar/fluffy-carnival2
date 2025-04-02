import { Router } from "express";
import TaskController from "../controllers/task.controller";

export default class TaskRoutes {
    public router = Router();
    private controller : TaskController;
    constructor(taskController:TaskController) {
        this.router = Router();
        this.controller = taskController;
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post("/tasks", this.controller.createTask.bind(this.controller));
        this.router.get("/tasks", this.controller.getTasks.bind(this.controller));
        this.router.put("/tasks/:id", this.controller.updateTask.bind(this.controller));
        this.router.delete("/tasks/:id", this.controller.deleteTask.bind(this.controller));
    }
}