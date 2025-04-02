import express, { Request, Response } from 'express';
import {v7 as uuidv7} from 'uuid';
import {ITaskRepository} from '../repos/ITaskRepository';
import { Task } from '../../common/types';
import {ValidationError, validationResult} from "express-validator";

export default class TaskController {
    private taskRepository: ITaskRepository;
    constructor(taskRepo: ITaskRepository) {
        this.taskRepository = taskRepo;
    }
    async getTasks(req: Request, res: Response) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map((error: ValidationError) => error.msg);
            res.status(400).json({error: errorMessages.join(",")});
            return;
        }
        try {
            const page: number = parseInt(req.query.page as string, 10) || 1;
            const limit: number = parseInt(req.query.limit as string, 10) || 10;

            const {tasks, total} = await this.taskRepository.getTasks(page, limit);

            res.json({
                tasks,
                total,
                currentPage: page,
                totalPages: Math.ceil(total / limit)
            });
        } catch (error) {
            console.error("Error fetching tasks:", error);
            res.status(500).json({error: "Failed to fetch tasks"});
        }
    };

    async createTask(req: Request, res: Response) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map((error: ValidationError) => error.msg);
            res.status(400).json({error: errorMessages.join(",")});
            return;
        }
        try {
            const task: Task = {
                _id: uuidv7(),
                title: req.body.title,
                description: req.body.description,
                dueDate: req.body.dueDate,
            };
            await this.taskRepository.createTask(task);
            res.status(201).json(task);
        } catch (error) {
            console.error("Error creating task:", error);
            res.status(500).json({error: "Failed to create task"});
        }
    };

    async updateTask(req: Request, res: Response)  {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map((error: ValidationError) => error.msg);
            res.status(400).json({ error: errorMessages.join(',') });
            return;
        }
        try {
            const id = req.params.id;
            const task: Task = {
                _id: id,
                title: req.body.title,
                description: req.body.description,
                dueDate: req.body.dueDate,
            };
            const updated = await this.taskRepository.updateTask(id, task);
            if (!updated) {
                res.status(404).json({ error: "Task not found" });
                return;
            }
            res.json(task);
        } catch (error) {
            console.error("Error updating task:", error);
            res.status(500).json({ error: "Failed to update task" });
        }
    };

    async deleteTask(req: Request, res: Response) {
        try {
            const id = req.params.id;
            const deleted = await this.taskRepository.deleteTask(id);
            if (!deleted) {
                res.status(404).json({error: "Task not found"});
                return;
            }
            res.sendStatus(204);
        } catch (error) {
            console.error("Error deleting task:", error);
            res.status(500).json({error: "Failed to delete task"});
        }
    };
}