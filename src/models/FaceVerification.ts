import mongoose, { Schema, Document } from 'mongoose';

export interface IFaceVerification extends Document {
  userId: mongoose.Types.ObjectId;
  selfieUrl: string;
  fileName: string;
  uploadedAt: Date;
  verifiedAt?: Date;
  matchScore?: number;
}

const faceVerificationSchema = new Schema<IFaceVerification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
      unique: true,
    },
    selfieUrl: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    verifiedAt: {
      type: Date,
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

const FaceVerification = mongoose.model<IFaceVerification>(
  'FaceVerification',
  faceVerificationSchema
);

export default FaceVerification;
