import { Schema, model } from "mongoose";

const cropSchema = new Schema(
  {
    x: Number,
    y: Number,
    width: Number,
    height: Number,
  },
  { _id: false }
);

const imageSchema = new Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  crop: cropSchema,
  order: { type: Number, default: 0 },
});

const eventSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true, trim: true, maxlength: 10000 },
    date: { type: Date, required: true },
    endDate: { type: Date, default: null },
    timezone: { type: String, default: "" },
    location: { type: String, required: true, trim: true, maxlength: 150 },
    locationType: {
      type: String,
      enum: ["in-person", "online"],
      default: "in-person",
    },
    meetingUrl: { type: String, trim: true, maxlength: 500, default: "" },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    capacity: { type: Number, min: 1, default: null },
    requireApproval: { type: Boolean, default: false },
    registrationOpen: { type: Boolean, default: true },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default:"public",
    },
    theme: { type: String, default: "minimal" },
    coverImage: { type: imageSchema, default: null },
    gallery: { type: [imageSchema], default: [] },
  },
  { timestamps: true }
);

export const Event = model("Event", eventSchema);