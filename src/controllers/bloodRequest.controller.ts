import { Response, NextFunction } from "express";
import { BloodRequest } from "../models/bloodRequest.model";
import { RequestUrgency, RequestStatus, NotificationType } from "../@types/enum.types";
import { AppError } from "../utils/customError.util";
import { cathAsync } from "../utils/catchAsync.util";
import { sendResponse } from "../utils/sendResponse.util";
import { deleteFileFromCloudinary, upload } from "../utils/cloudinary.util";
import { AuthRequest } from "../middlewares/auth.middleware";
import { User } from "../models/user.model";
import { createNotification, notifyMatchingDonors } from "../utils/notification.util";

export const createBloodRequest = cathAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const {
      patient,
      bloodGroup,
      units,
      hospital,
      district,
      phone,
      requiredDate,
      urgency,
    } = req.body;

    const requester = req.user?._id;

    const file = req.file;
    console.log(file);

    if (!patient) throw new AppError("Patient name is required", 400);
    if (!bloodGroup) throw new AppError("Blood group is required", 400);
    if (!units) throw new AppError("Units required is required", 400);
    if (!hospital) throw new AppError("Hospital name is required", 400);
    if (!district) throw new AppError("District is required", 400);
    if (!phone) throw new AppError("Contact phone number is required", 400);
    if (!requester) throw new AppError("Requester ID is required", 400);

    if (!file) {
      throw new AppError("Medical document / prescription image is required", 400);
    }

    const existingPendingRequest = await BloodRequest.findOne({
      requester,
      patient: patient.trim(),
      hospital: hospital.trim(),
      status: RequestStatus.PENDING,
    });

    if (existingPendingRequest) {
      throw new AppError(
        "A pending blood request for this patient at this hospital already exists!",
        400
      );
    }

    const newRequest = new BloodRequest({
      patient,
      bloodGroup: bloodGroup.trim().toUpperCase(),
      units: Number(units),
      hospital,
      district,
      phone,
      requiredDate: requiredDate ? new Date(requiredDate) : new Date(),
      urgency: urgency || RequestUrgency.MEDIUM,
      requester,
      status: RequestStatus.PENDING,
      medicalDocument: {
        path : "",
        public_id : ""
      },
    });

    if (file) {
      const { path, public_id } = await upload(file, "/medical_document");
      newRequest.medicalDocument = {
        path : path,
        public_id : public_id,
      };
    }

    await newRequest.save();

    notifyMatchingDonors({
      bloodGroup : newRequest.bloodGroup,
      district : newRequest.district,
      message : `Urgent : ${newRequest.bloodGroup} blood needed at ${newRequest.hospital},${newRequest.district}`,
      bloodRequestId : newRequest._id as any,
      excludeUserId : requester,
    });

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Blood request created successfully with medical document!",
      data: newRequest,
    });
  }
);

export const getAllBloodRequests = cathAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { bloodGroup, district, status, urgency } = req.query;

    let filter: any = {};

    if (bloodGroup) {
      filter.bloodGroup = String(bloodGroup).trim().toUpperCase();
    }

    if (district) {
      filter.district = new RegExp(String(district).trim(), "i");
    }

    if (status) {
      filter.status = status;
    } else {
      filter.status = RequestStatus.PENDING; 
    }

    if (urgency) {
      filter.urgency = urgency;
    }

    const requests = await BloodRequest.find(filter)
      .populate("requester", "name email phone")
      .sort({ createdAt: -1 });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: requests.length > 0
        ? "Blood requests fetched successfully"
        : "No blood requests found",
      data: requests,
    });
  }
);

export const getBloodRequestById = cathAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const request = await BloodRequest.findById(id).populate(
      "requester",
      "name email phone"
    );

    if (!request) {
      throw new AppError("Blood request not found", 404);
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Blood request details fetched successfully",
      data: request,
    });
  }
);

export const updateBloodRequestStatus = cathAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { status } = req.body;
    const file = req.file;

    if (!status) throw new AppError("Status is required to update", 400);

    const updatedRequest = await BloodRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedRequest) {
      throw new AppError("Blood request not found", 404);
    }

    if (file) {
      //delete old image
      deleteFileFromCloudinary(updatedRequest.medicalDocument.public_id);

      // upload new image
      const { path, public_id} = await upload(file, "/medicalDocument");
      updatedRequest.medicalDocument = {
        path,
        public_id,
      };
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: `Blood request status updated to ${status}!`,
      data: updatedRequest,
    });
  }
);

export const deleteBloodRequest = cathAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const deletedRequest = await BloodRequest.findById(id);

    if (!deletedRequest) {
      throw new AppError("Blood request not found", 404);
    }

    await deleteFileFromCloudinary(deletedRequest.medicalDocument.public_id);

    await deletedRequest.deleteOne();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Blood request deleted successfully!",
      data: null,
    });
  }
);

export const fulfillBloodRequest = cathAsync(
  async(req : AuthRequest, res : Response, next : NextFunction) =>{
    const { id } = req.params;
    const donorId = req.user?._id;

    if (!donorId) throw new AppError("Unauthorized", 401);

    const request = await BloodRequest.findById(id);

    if(!request) {
      throw new AppError ("Blood request not found", 404);
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new AppError(`This is already ${request.status.toLowerCase()}, cannot fulfill`, 400);
    }

    if(request.requester.toString() === donorId) {
      throw new AppError("You cannot fulfill your own blood request", 400);
    }

    request.status = RequestStatus.FULFILLED;
    request.fulfilledBy = donorId as any;
    await request.save();

    createNotification({
      recipient : request.requester,
      type : NotificationType.REQUEST_FULFILLED,
      message : `Great news! Your blood request for ${request.patient} has been fulfilled.`,
      bloodRequest : request._id as any,
    });

    // donor ko lastDonationDate update garne
    await User.findByIdAndUpdate(donorId, {
      lastDonationDate: new Date(),
    });

    sendResponse(res, {
      statusCode : 200,
      success : true,
      message : "Blood request fulfilled successfully! Thank you for donating.",
      data : request,
    });
  }
);

export const getMyRequests = cathAsync(
  async(req : AuthRequest, res : Response, next : NextFunction) => {
    const requesterId = req.user?._id;

    if(!requesterId) throw new AppError("Unauthorized", 401);

    const requests = await BloodRequest.find({ requester : requesterId })
    .populate("fulfilledBy", "name email phone")
    .sort({ createdAt : -1 });

    sendResponse(res, {
      statusCode : 200,
      success : true,
      message : requests.length > 0
      ? "Your blood requests fetched successfully!"
      : "You have not created any blood requests yet",
      data : requests,
    });
  }
);

export const cancelBloodRequest = cathAsync(
  async(req : AuthRequest, res : Response, next : NextFunction) => {
    const { id } = req.params;
    const userId = req.user?._id;

    const request = await BloodRequest.findById(id);

    if(!request) {
      throw new AppError("Blood request not found", 404);
    }
    
    if(request.requester.toString() !== userId) {
      throw new AppError("You can only cancel your own blood requests", 403);
    }
    
    if(request.status === RequestStatus.FULFILLED) {
      throw new AppError("Cannot cancel a request that has already been fulfilded", 400);
    }

    if(request.status === RequestStatus.CANCELLED) {
      throw new AppError("This request is already cancelled", 400);
    }

    request.status = RequestStatus.CANCELLED;
    await request.save();

    sendResponse(res, {
      statusCode : 200,
      success : true,
      message : "Blood request cancelled successfully!",
      data : request,
    });
  }
);