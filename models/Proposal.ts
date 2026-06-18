import mongoose, { Schema } from "mongoose";
import { IProposal } from "../types";

const proposalAttachmentSchema = new Schema(
  {
    name: String,
    url: String,
  },
  { _id: false }
);

const proposalSchema = new Schema<IProposal>(
  {
    job: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    freelancer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    coverLetter: {
      type: String,
      required: true,
    },
    bidAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    estimatedDuration: String,
    attachments: {
      type: [proposalAttachmentSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["pending", "shortlisted", "accepted", "rejected", "withdrawn"],
      default: "pending",
    },
    clientResponse: String,
  },
  { timestamps: true }
);

proposalSchema.index({ job: 1, freelancer: 1 }, { unique: true });

const Proposal =
  (mongoose.models.Proposal as mongoose.Model<IProposal>) ||
  mongoose.model<IProposal>("Proposal", proposalSchema);

export default Proposal;
