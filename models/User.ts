import mongoose, { Schema } from "mongoose";
import { IUser } from "../types";

const portfolioItemSchema = new Schema(
  {
    title: String,
    imageUrl: String,
    description: String,
    link: String,
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    university: {
      type: Schema.Types.ObjectId,
      ref: 'University',
      required: true,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    photoURL: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["student", "faculty", "alumni", "department"],
      required: true,
    },
    department: String,
    studentId: String,
    bio: {
      type: String,
      maxlength: 500,
      default: "",
    },
    skills: {
      type: [String],
      default: [],
    },
    portfolio: {
      type: [portfolioItemSchema],
      default: [],
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    completedJobs: {
      type: Number,
      default: 0,
    },
    responseTime: {
      type: String,
      default: "Not available",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "suspended", "banned"],
      default: "active",
    },
    suspensionReason: String,
  },
  { timestamps: true }
);

userSchema.index({ university: 1, status: 1, role: 1 });
userSchema.index({ skills: 1 });

const User =
  (mongoose.models.User as mongoose.Model<IUser>) ||
  mongoose.model<IUser>("User", userSchema);

export default User;
