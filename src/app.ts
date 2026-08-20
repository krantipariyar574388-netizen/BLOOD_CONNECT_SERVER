import express, { Request, Response } from "express";
import { errorHandler } from './middlewares/errorHandler.middleware';
import bloodRequestRoutes from './routes/bloodRequest.route';
import userRoutes from './routes/user.route';
import { AppError } from "./utils/customError.util";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import notificationRoutes from './routes/notification.route';
import cors from 'cors';

const app = express();

dotenv.config();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin : "*",
}),
);

app.get("/",(req : Request, res : Response) => {
    res.status(200).json({
        message : "Server is up and running!!",
        status : "success",
        success : true,
        data : [],
    });
});

app.use('/bloodrequests', bloodRequestRoutes);
app.use('/users', userRoutes);
app.use('/notifications', notificationRoutes);

app.use((req, res, next) => {
    const message = `Can not ${req.method} on ${req.path}`;
    next(new AppError(message, 400));
});

//error handling middleware
app.use(errorHandler);

export default app;

// 23 july 58:57