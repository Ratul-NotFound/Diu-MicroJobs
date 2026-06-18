import mongoose, { Schema } from "mongoose";
import { IMessage } from "../types";

const messageAttachmentSchema = new Schema(
  {
    name: String,
    url: String,
    type: String,
  },
  { _id: false }
);

const messageSchema = new Schema<IMessage>(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    attachments: {
      type: [messageAttachmentSchema],
      default: [],
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: 1 });

const Message =
  (mongoose.models.Message as mongoose.Model<IMessage>) ||
  mongoose.model<IMessage>("Message", messageSchema);

export default Message;
