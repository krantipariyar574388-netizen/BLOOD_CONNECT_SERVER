import express, { Router } from "express";
import {
    getMyNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
} from "../controllers/notification.controller";
import { authentication } from "../middlewares/auth.middleware";

const router : Router = express.Router();
 
router.get("/", authentication(), getMyNotifications);
router.patch("/:id/read", authentication(), markNotificationAsRead);
router.patch("/read-all", authentication(), markAllNotificationsAsRead);
router.delete("/:id", authentication(), deleteNotification);

export default router;