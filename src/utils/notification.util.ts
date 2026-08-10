import { Notification  } from "../models/notification.model";
import { UserRole, BloodGroup, NotificationType, RequestUrgency } from "../@types/enum.types";
import { Types } from "mongoose";
import  { User }  from "../models/user.model";
import { sendUrgentRequestEmail } from "./email.util";

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
    urgency,
    requestDetails,
} : {
    bloodGroup : BloodGroup;
    district : string;
    message : string;
    bloodRequestId : Types.ObjectId | string;
    excludeUserId? : Types.ObjectId | string;
    urgency?: RequestUrgency;
    requestDetails?: {
        patientName : string;
        hospital : string;
        phone : string;
        unitsNeeded : number;
    };
}) => {
    const matchingDonors = await User.find({
        role : UserRole.DONOR,
        isAvailable : true,
        bloodGroup,
        district : new RegExp(district.trim(), "i"),
        ...(excludeUserId ? { _id : {$ne: excludeUserId}} : {}),
    }).select("_id email");

    const notifications = matchingDonors.map((donor : { _id : Types.ObjectId }) => ({
        recipient : donor._id,
        type : NotificationType.NEW_REQUEST,
        message,
        bloodRequest : bloodRequestId,
    }));

    if(notifications.length > 0) {
        await Notification.insertMany(notifications);
    }

    if(urgency === RequestUrgency.CRITICAL && requestDetails) {
        for(const donor of matchingDonors as { _id : Types.ObjectId; email : string }[]) {
            sendUrgentRequestEmail(donor.email, {
                patientName : requestDetails.patientName,
                bloodGroup,
                hospital : requestDetails.hospital,
                district,
                phone : requestDetails.phone,
                unitsNeeded : requestDetails.unitsNeeded,
            });
        }
    }
};