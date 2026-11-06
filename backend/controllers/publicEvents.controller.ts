import { Request, Response } from "express";
import { Event } from "../models/Event";
import { isAtCapacity } from "../utils/registration";
import { startOfTodayIST } from "../utils/istDay";

// Never send the meeting link to the public. Confirmed guests get it from
// GET /api/events/:id/meeting instead.
const PUBLIC_FIELDS = "-__v -meetingUrl";

function sortGallery<T extends { gallery?: { order: number }[] }>(event: T): T {
  return {
    ...event,
    gallery: [...(event.gallery ?? [])].sort((a, b) => a.order - b.order),
  } as T;
}

export async function listPublicEvents(
  req: Request,
  res: Response
): Promise<void> {
  const upcoming = req.query.upcoming === "true";
  const past = req.query.past === "true";

  if (upcoming && past) {
    res.status(400).json({
      success: false,
      message: "Use either upcoming or past, not both.",
    });
    return;
  }

  const today = startOfTodayIST();

  // "$ne private" also matches old events that have no visibility field yet.
  // "as const" tells TypeScript this is exactly "private", not just any string.
  const notPrivate = { visibility: { $ne: "private" as const } };

  const filter = upcoming
    ? { ...notPrivate, date: { $gte: today } }
    : past
    ? { ...notPrivate, date: { $lt: today } }
    : notPrivate;

  const sort: Record<string, 1 | -1> = upcoming
    ? { date: 1, createdAt: 1 }
    : { date: -1, createdAt: -1 };

  const events = await Event.find(filter)
    .sort(sort)
    .select(PUBLIC_FIELDS)
    .lean();
  res.json({ success: true, data: events.map(sortGallery) });
}

export async function getPublicEvent(
  req: Request,
  res: Response
): Promise<void> {
  const event = await Event.findOne({ slug: req.params.slug })
    .select(PUBLIC_FIELDS)
    .lean();
  if (!event) {
    res.status(404).json({ success: false, message: "Event not found." });
    return;
  }

  // Booleans only. The public page must never learn how many people signed up.
  const isFull = await isAtCapacity(event._id, event.capacity);

  res.json({
    success: true,
    data: {
      ...sortGallery(event),
      registrationOpen: event.registrationOpen !== false,
      isFull,
    },
  });
}