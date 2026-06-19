import mongoose, { Schema } from "mongoose";
import { IJob } from "../types";

const attachmentSchema = new Schema(
  {
    name: String,
    url: String,
    type: String,
  },
  { _id: false }
);

const budgetSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["fixed", "range", "hourly"],
      required: true,
    },
    min: {
      type: Number,
      required: true,
    },
    max: Number,
    currency: {
      type: String,
      default: "BDT",
    },
  },
  { _id: false }
);

const jobSchema = new Schema<IJob>(
  {
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subcategory: String,
    budget: {
      type: budgetSchema,
      required: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: [
        "draft",
        "pending_review",
        "open",
        "in_review",
        "accepted",
        "contracted",
        "in_progress",
        "delivered",
        "revision_requested",
        "completed",
        "cancelled",
        "disputed",
        "rejected",
      ],
      default: "draft",
    },
    skills: {
      type: [String],
      default: [],
    },
    urgency: {
      type: String,
      enum: ["low", "normal", "urgent"],
      default: "normal",
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    thumbnail: {
      type: String,
      default: "",
    },
    proposalCount: {
      type: Number,
      default: 0,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rejectionReason: String,
    cancellationReason: String,
  },
  { timestamps: true }
);

jobSchema.index({ status: 1, category: 1 });
jobSchema.index({ client: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ skills: 1 });

const Job =
  (mongoose.models.Job as mongoose.Model<IJob>) ||
  mongoose.model<IJob>("Job", jobSchema);

export default Job;
