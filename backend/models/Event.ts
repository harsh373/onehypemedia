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
    location: { type: String, required: true, trim: true, maxlength: 150 },
    coverImage: { type: imageSchema, default: null },
    gallery: { type: [imageSchema], default: [] },
  },
  { timestamps: true }
);

export const Event = model("Event", eventSchema);