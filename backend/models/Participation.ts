import { Schema, model } from "mongoose";

const participationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    // "registered" means CONFIRMED. "pending" waits for admin approval.
    status: {
      type: String,
      enum: ["registered", "pending", "declined", "cancelled"],
      default: "registered",
      required: true,
    },
    registeredAt: { type: Date, default: Date.now },
    checkedInAt: { type: Date, default: null },
  },
  { timestamps: true }
);

participationSchema.index({ userId: 1, eventId: 1 }, { unique: true });

export const Participation = model("Participation", participationSchema);