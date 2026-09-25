import mongoose, { Document } from "mongoose";
import { BloodGroup, UserRole } from "../@types/enum.types";
import { ImageSchema } from "./image.model";

export interface IUser extends Document {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  bloodGroup: BloodGroup;
  district: string;
  role: UserRole;
  profile_image?: {
    path : string;
    public_id : string;
  };
  lastDonationDate?: Date | null;
  isAvailable: boolean;
  resetPasswordToken?: string | null;
  resetPasswordExpiry?: Date | null;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    bloodGroup: {
      type: String,
      enum: Object.values(BloodGroup),
      required: true,
    },
    district: {
      type: String,
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.DONOR,
    },
    profile_image: {
      type: ImageSchema,
      default: null,
    },
    lastDonationDate: {
      type: Date,
      default: null,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    resetPasswordToken : {
      type : String,
      default: null,
      select : false,
    },
    resetPasswordExpiry : {
      type : Date,
      default : null,
      select : false
    },
  },
  {
    timestamps: true,
  },
);

export const User = mongoose.model<IUser>("User", userSchema);
