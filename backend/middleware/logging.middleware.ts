import { Request, Response, NextFunction } from 'express';
const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Request Body:', req.body);
    const originalSend = res.send;
    res.send = function (body?): Response {
        if (body) {
            console.log('Response Body:', body);
        }
        return originalSend.call(this, body);
    };
    next();
}
export default loggingMiddleware;