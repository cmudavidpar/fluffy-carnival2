import { Task } from "../../common/types";

export interface ITaskRepository {
    getTasks(page: number, limit: number): Promise<{ tasks: Task[]; total: number }>;
    createTask(task: Task): Promise<void>;
    updateTask(id: string, task: Task): Promise<boolean>;
    deleteTask(id: string): Promise<boolean>;
}