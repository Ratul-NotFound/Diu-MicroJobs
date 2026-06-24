import mongoose, { Schema } from 'mongoose';
import { IUniversity } from '../types';

const universitySchema = new Schema<IUniversity>(
  {
    name: {
      type: String,
      required: true,
    },
    shortName: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    domains: {
      type: [String],
      required: true,
    },
    logo: {
      type: String,
      default: '',
    },
    departments: {
      type: [String],
      default: [],
    },
    currency: {
      type: String,
      default: 'BDT',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

universitySchema.index({ slug: 1 }, { unique: true });
universitySchema.index({ domains: 1 });
universitySchema.index({ isActive: 1 });

const University =
  (mongoose.models.University as mongoose.Model<IUniversity>) ||
  mongoose.model<IUniversity>('University', universitySchema);

export default University;
