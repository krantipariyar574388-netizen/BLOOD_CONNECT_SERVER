import { Notification  } from "../models/notification.model";
import { NotificationType } from "../@types/enum.types";
import { Types } from "mongoose";
import { UserRole, BloodGroup } from "../@types/enum.types";
import  { User }  from "../models/user.model";

interface CreateNotificationInput {
    recipient : Types.ObjectId | string;
    type : NotificationType;
    message : string;
    bloodRequest? : Types.ObjectId | string | null;
}

export const createNotification = async({
    recipient,
    type,
    message,
    bloodRequest = null,
} : CreateNotificationInput) => {
    try {
        await Notification.create({
            recipient,
            type,
            message,
            bloodRequest,
        });
    } catch (error) {
        console.log("Failed to create notification : ", error);
    }
};

export const notifyMatchingDonors = async ({
    bloodGroup,
    district,
    message,
    bloodRequestId,
    excludeUserId,
} : {
    bloodGroup : BloodGroup;
    district : string;
    message : string;
    bloodRequestId : Types.ObjectId | string;
    excludeUserId? : Types.ObjectId | string;
}) => {
    const matchingDonors = await User.find({
        role : UserRole.DONOR,
        isAvailable : true,
        bloodGroup,
        district : new RegExp(district.trim(), "i"),
        ...(excludeUserId ? { _id : {$ne: excludeUserId}} : {}),
    }).select("_id");

    const notifications = matchingDonors.map((donor : { _id : Types.ObjectId }) => ({
        recipient : donor._id,
        type : NotificationType.NEW_REQUEST,
        message,
        bloodRequest : bloodRequestId,
    }));

    if(notifications.length > 0) {
        await Notification.insertMany(notifications);
    }
};