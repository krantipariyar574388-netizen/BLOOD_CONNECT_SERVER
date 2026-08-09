import { Response, NextFunction } from "express";
import { Notification } from "../models/notification.model";
import { AppError } from "../utils/customError.util";
import { cathAsync } from "../utils/catchAsync.util";
import { sendResponse } from "../utils/sendResponse.util";
import { AuthRequest } from "../middlewares/auth.middleware";

export const getMyNotifications = cathAsync(
    async ( req : AuthRequest, res : Response, next : NextFunction) => {
        const userId = req.user?._id;
        if (!userId) throw new AppError("Unauthorized", 401);

        const notifications = await Notification.find({ recipient : userId })
        .populate("bloodRequest", "patient hospital bloodGroup status")
        .sort({ createAt : -1 });

        const unreadCount = notifications.filter((n) => !n.isRead).length;

        sendResponse(res, {
            statusCode : 200,
            success : true,
            message  :"Notifications fetched successfully",
            data : { notifications, unreadCount },
        });
    }
);

export const markNotificationAsRead = cathAsync(
    async (req : AuthRequest, res : Response, next : NextFunction) => {
        const { id } = req.params;
        const userId = req.user?._id;

        const notification = await Notification.findById(id);

        if(!notification) {
            throw new AppError("Notification not found", 404);
        }

        if(notification.recipient.toString() !== userId) {
            throw new AppError("You cannot access this notification", 403);
        }
        
        notification.isRead = true;
        await notification.save();

        sendResponse(res, {
            statusCode : 200,
            success : true,
            message : "Notification marked as read",
            data : notification,
        });
    }
);

export const markAllNotificationsAsRead = cathAsync(
    async (req : AuthRequest, res : Response, next : NextFunction) => {
        const userId = req.user?._id;

        if(!userId) throw new AppError("Unauthorized", 401);

        await Notification.updateMany(
            { recipient : userId, isRead : false },
            { isRead : true }
        );

        sendResponse(res, {
            statusCode : 200,
            success : true,
            message : "All notifications marked as read",
            data : null,
        });
    }
);

export const deleteNotification = cathAsync(
    async (req : AuthRequest, res : Response, next : NextFunction) => {
        const { id } = req.params;
        const userId = req.user?._id;

        const notification = await Notification.findById(id);

        if(!notification) {
            throw new AppError("Notification not found", 404);
        }

        if(notification.recipient.toString() !== userId) {
            throw new AppError("You cannot access this notification", 403);
        }

        await notification.deleteOne();

        sendResponse(res, {
            statusCode : 200,
            success : true,
            message : "Notification delete",
            data : null,
        });
    }
);