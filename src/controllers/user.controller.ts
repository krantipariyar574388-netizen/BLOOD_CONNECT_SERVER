import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.model";
import { comparePassword, hashPassword } from "../utils/bcrypt.util";
import { AppError } from "../utils/customError.util";
import { cathAsync } from "../utils/catchAsync.util";
import { deleteFileFromCloudinary, upload } from "../utils/cloudinary.util";
import { sendResponse } from "../utils/sendResponse.util";
import { generateJwtToken } from "../utils/jwt.util";
import { AuthRequest } from "../middlewares/auth.middleware";
import { generateResetToken, hashToken } from "../utils/token.util";
import ENV_CONFIG from "../config/env.config";
import { getPaginationMetadata, getPeginationParams } from "../utils/pagination.util";
import { sendResetPasswordEmail } from "../utils/email.util";

export const register = cathAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      name,
      email,
      password,
      phone,
      bloodGroup,
      district,
      role,
      lastDonationDate,
    } = req.body;

    const file = req.file;

    if (!name) throw new AppError("Name is required", 400);
    if (!email) throw new AppError("Email is required", 400);
    if (!password) throw new AppError("Password is required", 400);
    if (!phone) throw new AppError("Phone number is required", 400);
    if (!bloodGroup) throw new AppError("Blood group is required", 400);
    if (!district) throw new AppError("District is required", 400);

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError("User with this email already exists", 400);
    }

    const hashedPassword = await hashPassword(password);

    const formattedDonationDate = lastDonationDate
      ? new Date(lastDonationDate)
      : null;

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      bloodGroup: bloodGroup.trim().toUpperCase(),
      district,
      role: role || "donor",
      lastDonationDate: formattedDonationDate,
    });

    if (file) {
      const {path, public_id} = await upload(file,"/profile_images");
      newUser.profile_image = {
        path : path,
        public_id : public_id,
      };
    }

    await newUser.save();

    sendResponse(res, {
      statusCode: 201,
      message: "User registered successfully!",
      data: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        bloodGroup: newUser.bloodGroup,
        district: newUser.district,
        role: newUser.role,
        profile_image: newUser.profile_image,
        lastDonationDate: newUser.lastDonationDate,
        isAvailable: newUser.isAvailable,
      },
    });
  }
);

export const login = cathAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email) throw new AppError("Email is required", 400);
    if (!password) throw new AppError("Password is required", 400);

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) throw new AppError("Invalid credentials", 400);

    const isPasswordMatched = await comparePassword(password, user.password);
    if (!isPasswordMatched) throw new AppError("Invalid credentials", 400);

    const access_token = generateJwtToken({
      _id : user._id,
      email : user.email,
      role : user.role,
    });

    // set the token as an httpOnly cookie so auth.middleware can read it
    res.cookie("access_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const { password : p, __v, ...rest } = user.toObject();

    sendResponse(res, {
      statusCode: 200,
      message: "Logged in successfully!",
      data: {user :rest, access_token},
    });
  }
);

export const getEligibleDonors = cathAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { bloodGroup, district } = req.query;
    const { currentPage, limit, skip } = getPeginationParams(req.params);

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    let filter: any = {
      role: "donor",
      isAvailable: true,
      $or: [
        { lastDonationDate: { $exists: false } },
        { lastDonationDate: null },
        { lastDonationDate: { $lte: ninetyDaysAgo } },
      ],
    };

    if (bloodGroup) {
      filter.bloodGroup = String(bloodGroup).trim().toUpperCase();
    }

    if (district) {
      filter.district = new RegExp(String(district).trim(), "i");
    }

    const totalCount = await User.countDocuments(filter);

    const donors = await User.find(filter)
    .select("-password")
    .skip(skip)
    .limit(limit);

    sendResponse(res, {
      statusCode: 200,
      message: donors.length > 0 
        ? "Eligible donors fetched successfully" 
        : "No eligible donors found matching your criteria",
      data: {
        donors,
      pagination : getPaginationMetadata(totalCount, limit, currentPage),
    },
    });
  }
);

// Logout
export const logout = cathAsync(
  async(req : Request, res : Response, next : NextFunction) => {
    res.clearCookie("access_token", {
      httpOnly : true,
      secure : process.env.NODE_ENV === "production",
      sameSite : "lax",
    });

    sendResponse(res, {
      statusCode : 200,
      message : "Logged out successfully!",
      data : null,
    });
  }
);

// get current user(me)
export const getMe = cathAsync(
  async (req : AuthRequest, res : Response, next : NextFunction) => {
    const user = await User.findById(req.user?._id).select("-password");

    if(!user) throw new AppError("User not found", 404);

    sendResponse(res, {
      statusCode : 200,
      message : "Current user fetched successfully",
      data : user,
    });
  }
);

// update profile
export const updateProfile = cathAsync(
  async (req : AuthRequest, res : Response, next : NextFunction) => {
    const { name, phone, district } = req.body;
    const file = req.file;

    const user = await User.findById(req.user?._id);
    if(!user) throw new AppError("User not found", 404);

    if(name) user.name = name;
    if(phone) user.phone = phone;
    if(district) user.district = district;

    if(file) {
      if(user.profile_image?.public_id) {
        await deleteFileFromCloudinary(user.profile_image.public_id);
      }
      const {path, public_id} = await upload(file, "/profile_image");
      user.profile_image = { path, public_id };
    }
    await user.save();
    
    const { password, ...rest } = user.toObject();

    sendResponse(res, {
      statusCode: 200,
      message : "Profile updated successfully!",
      data : rest,
    });
  }
);

// change password
export const changePassword = cathAsync(
  async (req : AuthRequest, res : Response, next : NextFunction) => {
    const { oldPassword, newPassword } = req.body;

    if(!oldPassword) throw new AppError("OLD password is required", 400);
    if(!newPassword) throw new AppError("New Password is Required", 400);

    const user = await User.findById(req.user?._id);
    if(!user) throw new AppError("User not found", 404);

    const isMatched = await comparePassword(oldPassword, user.password);
    if(!isMatched) throw new AppError("Old password is incorrect", 404);

    user.password = await hashPassword(newPassword);
    await user.save();

    sendResponse(res, {
      statusCode : 200,
      message : "Password changed successfully!",
      data : null,
    });
  }
);

// toggle availility 
export const toggleAvailability = cathAsync(
  async (req : AuthRequest, res : Response, next : NextFunction) => {
    const user = await User.findById(req.user?._id);
    if(!user) throw new AppError("User not found", 404);

    user.isAvailable = !user.isAvailable;
    await user.save();

    sendResponse(res, {
      statusCode : 200,
      message : `You are now marked as ${user.isAvailable ? "available" : "unavailable"}!`,
      data : { isAvailable : user.isAvailable },
    });
  }
);

//forgot password (email pathaune)
export const forgotPassword = cathAsync(
  async (req : Request, res : Response, next : NextFunction) => {
    const { email } = req.body;
    if (!email) throw new AppError("Email is required",404);

    const user = await User.findOne({ email : email.toLowerCase() });

    if(!user) {
      return sendResponse(res, {
        statusCode : 200,
        message : "If that email exists, a reset link has been sent.",
        data : null,
      });
    }

    const { rawToken, hashedToken } = generateResetToken();

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    // console.log("🔑 RAW RESET TOKEN:", rawToken);
    const resetUrl = `${ENV_CONFIG.FRONTEND_URL}/reset-password/${rawToken}`;
    await sendResetPasswordEmail(user.email, resetUrl);


    sendResponse(res, {
      statusCode : 200,
      message : "if that email exists, a reset link has been sent.",
      data : null,
    });
  }
);

// reset password (token verify garera password change garne)
export const resetPassword = cathAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    if(!token || typeof token !== "string") {
      throw new AppError("Reset token is required", 400);
    }

    if (!newPassword) throw new AppError("New password is required", 400);

    const hashedToken = hashToken(token);

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: new Date() },
    }).select("+resetPasswordToken +resetPasswordExpiry");

    if (!user) {
      throw new AppError("Reset link is invalid or has expired", 400);
    }

    user.password = await hashPassword(newPassword);
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;
    await user.save();

    sendResponse(res, {
      statusCode: 200,
      message: "Password reset successfully! You can now log in.",
      data: null,
    });
  }
);