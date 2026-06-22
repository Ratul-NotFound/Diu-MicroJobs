import mongoose, { Schema } from "mongoose";
import { IAdmin } from "../types";

const adminSchema = new Schema<IAdmin>(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["super_admin", "moderator", "support"],
      required: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    lastLogin: Date,
  },
  { timestamps: true }
);

adminSchema.index({ firebaseUid: 1 }, { unique: true });

const Admin =
  (mongoose.models.Admin as mongoose.Model<IAdmin>) ||
  mongoose.model<IAdmin>("Admin", adminSchema);

export default Admin;
