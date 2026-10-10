import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import { Event } from "../models/Event";
import { Participation } from "../models/Participation";
import { uniqueSlug } from "../utils/slugify";
import { parseEventInput } from "../utils/validateEvent";
import { destroyAssets } from "../utils/cloudinaryHelpers";

function invalidId(res: Response): void {
  res.status(400).json({ success: false, message: "Invalid event ID." });
}

function notFound(res: Response): void {
  res.status(404).json({ success: false, message: "Event not found." });
}

export async function listEvents(_req: Request, res: Response): Promise<void> {
  const events = await Event.find().sort({ date: -1, createdAt: -1 });
  res.json({ success: true, data: events });
}

export async function getEvent(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!isValidObjectId(id)) return invalidId(res);

  const event = await Event.findById(id);
  if (!event) return notFound(res);

  res.json({ success: true, data: event });
}

export async function createEvent(req: Request, res: Response): Promise<void> {
  const { data, error } = parseEventInput(req.body);
  if (!data) {
    res.status(400).json({ success: false, message: error });
    return;
  }

  const slug = await uniqueSlug(data.title);
  const event = await Event.create({ ...data, slug });

  res
    .status(201)
    .json({ success: true, data: event, message: "Event created successfully." });
}

export async function updateEvent(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!isValidObjectId(id)) return invalidId(res);

  const { data, error } = parseEventInput(req.body);
  if (!data) {
    res.status(400).json({ success: false, message: error });
    return;
  }

  const existing = await Event.findById(id).select("coverImage gallery");
  if (!existing) return notFound(res);

  const oldIds = [
    existing.coverImage?.publicId,
    ...existing.gallery.map((image) => image.publicId),
  ].filter((publicId): publicId is string => Boolean(publicId));

  const keptIds = new Set<string>([
    data.coverImage.publicId,
    ...data.gallery.map((image) => image.publicId),
  ]);
  const removedIds = oldIds.filter((publicId) => !keptIds.has(publicId));

  const event = await Event.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!event) return notFound(res);

  await destroyAssets(removedIds);

  res.json({ success: true, data: event, message: "Event updated successfully." });
}

export async function deleteEvent(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!isValidObjectId(id)) return invalidId(res);

  const event = await Event.findByIdAndDelete(id);
  if (!event) return notFound(res);

  await Participation.deleteMany({ eventId: event._id });

  const publicIds = [
    event.coverImage?.publicId,
    ...event.gallery.map((image) => image.publicId),
  ].filter((publicId): publicId is string => Boolean(publicId));

  await destroyAssets(publicIds);

  res.json({ success: true, message: "Event deleted." });
}