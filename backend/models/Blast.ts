import { Schema, model } from "mongoose";

const blastSchema = new Schema(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    subject: { type: String, required: true, trim: true, maxlength: 150 },
    body: { type: String, required: true, maxlength: 5000 },
    audience: {
      type: String,
      enum: ["registered", "pending", "all-active"],
      required: true,
    },
    recipientCount: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["sending", "sent", "partial", "failed"],
      default: "sending",
    },
  },
  { timestamps: true }
);

export const Blast = model("Blast", blastSchema);