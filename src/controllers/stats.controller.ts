import { User } from "../models/user.model";
import { BloodRequest } from "../models/bloodRequest.model";
import { cathAsync } from "../utils/catchAsync.util";
import { sendResponse } from "../utils/sendResponse.util";
import { RequestStatus, UserRole } from "../@types/enum.types";

export const getLandingStats = cathAsync(async (req, res, next) => {
  const [bloodGroupCounts, totalDonors, livesSupported, requestsNow, districts] =
    await Promise.all([
      User.aggregate([
        { $match: { role: "donor" } },
        { $group: { _id: "$bloodGroup", count: { $sum: 1 } } },
      ]),
      User.countDocuments({ role: UserRole.DONOR }),
      BloodRequest.countDocuments({ status: RequestStatus.FULFILLED }),
      BloodRequest.countDocuments({ status: RequestStatus.PENDING }),
      User.distinct("district", { role: UserRole.DONOR }),
    ]);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Landing stats fetched successfully",
    data: {
      bloodGroupCounts,
      totalDonors,
      livesSupported,
      requestsNow,
      citiesCovered: districts.length,
    },
  });
});