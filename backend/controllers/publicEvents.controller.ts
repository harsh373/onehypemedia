import { Request, Response } from "express";
import { Event } from "../models/Event";

function sortGallery<T extends { gallery?: { order: number }[] }>(event: T): T {
  return {
    ...event,
    gallery: [...(event.gallery ?? [])].sort((a, b) => a.order - b.order),
  } as T;
}

function startOfTodayUTC(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
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

  const today = startOfTodayUTC();

  const filter = upcoming
    ? { date: { $gte: today } }
    : past
      ? { date: { $lt: today } }
      : {};

  const sort: Record<string, 1 | -1> = upcoming
    ? { date: 1, createdAt: 1 }
    : { date: -1, createdAt: -1 };

  const events = await Event.find(filter)
    .sort(sort)
    .select("-__v")
    .lean();
  res.json({ success: true, data: events.map(sortGallery) });
}

export async function getPublicEvent(
  req: Request,
  res: Response
): Promise<void> {
  const event = await Event.findOne({ slug: req.params.slug })
    .select("-__v")
    .lean();
  if (!event) {
    res.status(404).json({ success: false, message: "Event not found." });
    return;
  }
  res.json({ success: true, data: sortGallery(event) });
}