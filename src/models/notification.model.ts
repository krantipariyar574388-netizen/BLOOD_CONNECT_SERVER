import mongoose, { Schema, Document, Types } from "mongoose";
import { NotificationType } from "../@types/enum.types";

export interface INotification extends Document {
    recipient : Types.ObjectId;
    type : NotificationType;
    message : string;
    bloodRequest? : Types.ObjectId | null;
    isRead : boolean;
}

const notificationSchema : Schema = new mongoose.Schema<INotification> (
    {
        recipient : {
            type : Schema.Types.ObjectId,
            ref : "User",
            required : true,
            index : true,
        },
        type : {
            type : String,
            enum : Object.values(NotificationType),
            required : true,
        },
        message : {
            type : String,
            required : true,
        },
        bloodRequest : {
            type : Schema.Types.ObjectId,
            ref : "BloodRequest",
            default : null,
        },
        isRead : {
            type : Boolean,
            default : false,
        },
    },
    { timestamps : true }
);

export const Notification = mongoose.model<INotification>(
    "Notidication",
    notificationSchema
);