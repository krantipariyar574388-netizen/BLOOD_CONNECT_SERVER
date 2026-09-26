import mongoose, { Schema, Document, Types } from 'mongoose';
import { BloodGroup, RequestUrgency, RequestStatus } from '../@types/enum.types';
import { ImageSchema } from './image.model';

export interface IBloodRequest extends Document {
    requester : Types.ObjectId;
    patient  : string;
    bloodGroup : BloodGroup;
    units : number;
    hospital : string;
    district  : string;
    phone : string;
    requiredDate : Date;
    urgency: RequestUrgency;
    status : RequestStatus;
    medicalDocument: {
        path : string;
        public_id : string;
    };
    fulfilledBy? : Types.ObjectId | null;
}

const bloodRequestSchema = new mongoose.Schema<IBloodRequest>({
    requester : {
        type : Schema.Types.ObjectId,
        ref : 'User',
        required : true,
    },
    patient: {
        type: String,
        required: true
    },
    bloodGroup: {
      type: String,
      enum: Object.values(BloodGroup),
      required: true,
    },
    units: {
        type: Number,
        required: true,
        min: 1
    },
    hospital: {
        type: String,
        required: true
    },
    district: {
        type: String,
        required: true,
        index: true
    },
    phone: {
        type: String,
        required: true
    },
    requiredDate: {
        type: Date,
        required: true,
    },
    urgency: {
      type: String,
      enum: Object.values(RequestUrgency),
      default: RequestUrgency.MEDIUM, 
    },
    status: {
      type: String,
      enum: Object.values(RequestStatus),
      default: RequestStatus.PENDING,
    },
    medicalDocument: {
      type: ImageSchema,
      required : [true, "Medical document is required!!"],
    },
    fulfilledBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
  },
  { timestamps: true }
);

bloodRequestSchema.index(
  { requester: 1, patient: 1, hospital: 1, status: 1 },
  { 
    unique: true, 
    partialFilterExpression: { status: RequestStatus.PENDING } 
  }
);

export const BloodRequest = mongoose.model<IBloodRequest>('BloodRequest', bloodRequestSchema);