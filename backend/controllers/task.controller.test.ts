import request from 'supertest';
import express, { Express } from 'express';
import TaskController from './task.controller';
import { ITaskRepository } from '../repos/ITaskRepository';
import { Task } from '../../common/types';
import TaskRoutes from "../router/task.routes";

const mockTaskRepository: ITaskRepository = {
    getTasks: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
};

const app: Express = express();
app.use(express.json());
const taskController = new TaskController(mockTaskRepository);
const taskRoutes = new TaskRoutes(taskController);
app.use(taskRoutes.router);

describe('TaskController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('GET /tasks - should return tasks', async () => {
        const mockTasks: Task[] = [
            { _id: '1', title: 'Test Task', description: 'Test Description', dueDate: new Date() }
        ];
        (mockTaskRepository.getTasks as jest.Mock).mockResolvedValue({ tasks: mockTasks, total: 1 });

        const response = await request(app).get('/tasks');
        const responseTasks = response.body.tasks as Task[];
        expect(response.status).toBe(200);
        expect(responseTasks[0]._id).toEqual(mockTasks[0]._id);//TODO check whole payload
        expect(response.body.total).toBe(1);
    });

    test('POST /tasks - should create a new task', async () => {
        const newTask: Task = { _id: '1', title: 'New Task', description: 'New Description', dueDate: new Date() };
        //(mockTaskRepository.createTask as jest.Mock).mockResolvedValue();

        const response = await request(app)
            .post('/tasks')
            .send({ title: 'New Task', description: 'New Description', dueDate: new Date().toISOString() });

        expect(response.status).toBe(201);
        expect(response.body).toEqual(newTask);
    });

    test('PUT /tasks/:id - should update a task', async () => {
        const updatedTask: Task = { _id: '1', title: 'Updated Task', description: 'Updated Description', dueDate: new Date() };
        (mockTaskRepository.updateTask as jest.Mock).mockResolvedValue(true);

        const response = await request(app)
            .put('/tasks/1')
            .send({ title: 'Updated Task', description: 'Updated Description', dueDate: new Date().toISOString() });

        expect(response.status).toBe(200);
        expect(response.body).toEqual(updatedTask);
    });

    test('DELETE /tasks/:id - should delete a task', async () => {
        (mockTaskRepository.deleteTask as jest.Mock).mockResolvedValue(true);

        const response = await request(app).delete('/tasks/1');

        expect(response.status).toBe(204);
    });
});