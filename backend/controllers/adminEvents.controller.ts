import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import { Event } from "../models/Event";
import { Participation } from "../models/Participation";
import { Blast } from "../models/Blast";
import { uniqueSlug } from "../utils/slugify";
import { parseEventInput } from "../utils/validateEvent";
import { destroyAssets } from "../utils/cloudinaryHelpers";
import { getGuestCounts } from "../utils/registration";

function invalidId(res: Response): void {
  res.status(400).json({ success: false, message: "Invalid event ID." });
}

function notFound(res: Response): void {
  res.status(404).json({ success: false, message: "Event not found." });
}

function badRequest(res: Response, message: string): void {
  res.status(400).json({ success: false, message });
}

export async function listEvents(_req: Request, res: Response): Promise<void> {
  const [events, counts] = await Promise.all([
    Event.find().sort({ date: -1, createdAt: -1 }).lean(),
    Participation.aggregate<{ _id: unknown; count: number }>([
      { $match: { status: "registered" } },
      { $group: { _id: "$eventId", count: { $sum: 1 } } },
    ]),
  ]);

  const countByEvent = new Map<string, number>();
  for (const row of counts) countByEvent.set(String(row._id), row.count);

  const data = events.map((event) => ({
    ...event,
    registeredCount: countByEvent.get(String(event._id)) ?? 0,
  }));

  res.json({ success: true, data });
}

export async function getEvent(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!isValidObjectId(id)) return invalidId(res);

  const event = await Event.findById(id).lean();
  if (!event) return notFound(res);

  const counts = await getGuestCounts(event._id);

  res.json({
    success: true,
    data: {
      ...event,
      registeredCount: counts.registered,
      pendingCount: counts.pending,
    },
  });
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

// Focused update for the Registration tab. Only these three fields can change here.
export async function updateRegistration(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params;
  if (!isValidObjectId(id)) return invalidId(res);

  const input = (req.body ?? {}) as Record<string, unknown>;
  const update: {
    registrationOpen?: boolean;
    requireApproval?: boolean;
    capacity?: number | null;
  } = {};

  if ("registrationOpen" in input) {
    if (typeof input.registrationOpen !== "boolean") {
      return badRequest(res, "registrationOpen must be true or false.");
    }
    update.registrationOpen = input.registrationOpen;
  }

  if ("requireApproval" in input) {
    if (typeof input.requireApproval !== "boolean") {
      return badRequest(res, "requireApproval must be true or false.");
    }
    update.requireApproval = input.requireApproval;
  }

  if ("capacity" in input) {
    const capacity = input.capacity;
    if (capacity === null) {
      update.capacity = null;
    } else if (
      typeof capacity === "number" &&
      Number.isInteger(capacity) &&
      capacity >= 1 &&
      capacity <= 100000
    ) {
      update.capacity = capacity;
    } else {
      return badRequest(
        res,
        "Capacity must be a whole number from 1 to 100000, or empty for unlimited."
      );
    }
  }

  if (Object.keys(update).length === 0) {
    return badRequest(res, "Nothing to update.");
  }

  // Lowering capacity below the current guest count is allowed: nobody is removed,
  // it only blocks new sign-ups.
  const event = await Event.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  }).lean();
  if (!event) return notFound(res);

  const counts = await getGuestCounts(event._id);

  res.json({
    success: true,
    data: {
      ...event,
      registeredCount: counts.registered,
      pendingCount: counts.pending,
    },
    message: "Registration settings saved.",
  });
}

export async function deleteEvent(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!isValidObjectId(id)) return invalidId(res);

  const event = await Event.findByIdAndDelete(id);
  if (!event) return notFound(res);

  await Promise.all([
    Participation.deleteMany({ eventId: event._id }),
    Blast.deleteMany({ eventId: event._id }),
  ]);

  const publicIds = [
    event.coverImage?.publicId,
    ...event.gallery.map((image) => image.publicId),
  ].filter((publicId): publicId is string => Boolean(publicId));

  await destroyAssets(publicIds);

  res.json({ success: true, message: "Event deleted." });
}