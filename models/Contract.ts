import mongoose, { Schema } from "mongoose";
import { IContract } from "../types";

const milestoneSchema = new Schema(
  {
    title: String,
    amount: Number,
    deadline: Date,
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
    },
  },
  { _id: false }
);

const contractSchema = new Schema<IContract>(
  {
    job: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    proposal: {
      type: Schema.Types.ObjectId,
      ref: "Proposal",
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    freelancer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    terms: String,
    agreedAmount: {
      type: Number,
      required: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    deliverables: {
      type: [String],
      default: [],
    },
    milestones: {
      type: [milestoneSchema],
      default: [],
    },
    clientSigned: {
      type: Boolean,
      default: false,
    },
    freelancerSigned: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: [
        "pending_signatures",
        "active",
        "completed",
        "cancelled",
        "disputed",
      ],
      default: "pending_signatures",
    },
  },
  { timestamps: true }
);

contractSchema.index({ client: 1, createdAt: -1 });
contractSchema.index({ freelancer: 1, createdAt: -1 });
contractSchema.index({ job: 1 });

const Contract =
  (mongoose.models.Contract as mongoose.Model<IContract>) ||
  mongoose.model<IContract>("Contract", contractSchema);

export default Contract;
