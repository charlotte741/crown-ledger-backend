import mongoose, { Schema, Document } from 'mongoose';

export interface IKYCDocument extends Document {
  userId: mongoose.Types.ObjectId;
  documentType: 'passport' | 'drivers_license' | 'national_id' | 'residence_permit';
  documentNumber: string;
  fileUrl: string;
  fileName: string;
  uploadedAt: Date;
  verifiedAt?: Date;
}

const kycDocumentSchema = new Schema<IKYCDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      enum: ['passport', 'drivers_license', 'national_id', 'residence_permit'],
      required: true,
    },
    documentNumber: {
      type: String,
      required: true,
    },
    fileUrl: {
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
  },
  { timestamps: true }
);

const KYCDocument = mongoose.model<IKYCDocument>('KYCDocument', kycDocumentSchema);

export default KYCDocument;
