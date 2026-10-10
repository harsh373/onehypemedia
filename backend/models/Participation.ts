import { Schema, model } from "mongoose";

const participationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    status: {
      type: String,
      enum: ["registered", "cancelled"],
      default: "registered",
      required: true,
    },
    registeredAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

participationSchema.index({ userId: 1, eventId: 1 }, { unique: true });

export const Participation = model("Participation", participationSchema);