import { MongoClient, Db, Collection } from 'mongodb';
import { Task } from '../../common/types';
import { ITaskRepository } from './ITaskRepository';
import { MongoMemoryServer } from 'mongodb-memory-server';
class MemMongoTaskRepo implements ITaskRepository {

    private collection: Collection<Task>;

    constructor(db: Db) {
        this.collection = db.collection<Task>('tasks');
    }

    async getTasks(page: number, limit: number): Promise<{ tasks: Task[]; total: number }> {
        const skip = (page - 1) * limit;
        const query = {};

        const [items, total] = await Promise.all([
            this.collection.find(query)
                .skip(skip)
                .limit(limit)
                .sort({ _id: 1 })
                .toArray(),
            this.collection.countDocuments(query)
        ]);

        return { tasks: items, total };
    }

    async createTask(task: Task): Promise<void> {
        await this.collection.insertOne(task);
    }

    async updateTask(id: string, task: Task): Promise<boolean> {
        const result = await this.collection.updateOne({ _id: id }, { $set: task });
        return result.matchedCount > 0;
    }

    async deleteTask(id: string): Promise<boolean> {
        const result = await this.collection.deleteOne({ _id: id });
        return result.deletedCount > 0;
    }

    static async startMongoDB() {
        const mongoServer = await MongoMemoryServer.create();
        const uri = await mongoServer.getUri();
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db('testdb');
        const repo = new MemMongoTaskRepo(db);
        return { repo, mongoServer, client };
    }

    static async shutdownMongoDB(client: MongoClient, mongoServer: MongoMemoryServer) {
        await client.close();
        await mongoServer.stop();
    }
}

export default MemMongoTaskRepo;