import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import { Event } from "../models/Event";
import { Participation } from "../models/Participation";

function startOfTodayUTC(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function participate(req: Request, res: Response): Promise<void> {
  const eventId = String(req.params.id);
  if (!isValidObjectId(eventId)) {
    res.status(404).json({ success: false, message: "Event not found." });
    return;
  }

  const event = await Event.findById(eventId).select("date");
  if (!event) {
    res.status(404).json({ success: false, message: "Event not found." });
    return;
  }

  if (event.date < startOfTodayUTC()) {
    res.status(400).json({
      success: false,
      message: "This event has already taken place.",
    });
    return;
  }

  const userId = req.session.userId;
  const existing = await Participation.findOne({ userId, eventId });

  if (existing) {
    if (existing.status === "registered") {
      res.status(409).json({
        success: false,
        message: "You are already registered for this event.",
      });
      return;
    }
    // Cancelled before: reuse the SAME document.
    existing.status = "registered";
    existing.registeredAt = new Date();
    await existing.save();
    res.json({
      success: true,
      data: { status: existing.status },
      message: "You're registered again.",
    });
    return;
  }

  try {
    const created = await Participation.create({
      userId,
      eventId,
      status: "registered",
    });
    res.status(201).json({
      success: true,
      data: { status: created.status },
      message: "You're registered.",
    });
  } catch (err) {
    // Two requests raced past findOne: the unique index stopped the second one.
    if ((err as { code?: number }).code === 11000) {
      res.status(409).json({
        success: false,
        message: "You are already registered for this event.",
      });
      return;
    }
    throw new Error("Could not register for event.", { cause: err });
  }
}

export async function cancelParticipation(req: Request, res: Response): Promise<void> {
  const eventId = String(req.params.id);
  if (!isValidObjectId(eventId)) {
    res.status(404).json({ success: false, message: "Event not found." });
    return;
  }

  const existing = await Participation.findOne({
    userId: req.session.userId,
    eventId,
  });

  if (!existing) {
    res.status(404).json({
      success: false,
      message: "You are not registered for this event.",
    });
    return;
  }

  if (existing.status === "cancelled") {
    res.status(400).json({
      success: false,
      message: "Your registration is already cancelled.",
    });
    return;
  }

  existing.status = "cancelled";
  await existing.save();
  res.json({
    success: true,
    data: { status: existing.status },
    message: "Registration cancelled.",
  });
}

export async function getMyParticipation(req: Request, res: Response): Promise<void> {
  const eventId = String(req.params.id);
  if (!isValidObjectId(eventId)) {
    res.json({ success: true, data: { status: null } });
    return;
  }

  const existing = await Participation.findOne({
    userId: req.session.userId,
    eventId,
  }).select("status");

  res.json({ success: true, data: { status: existing ? existing.status : null } });
}

type PopulatedEvent = {
  _id: unknown;
  title: string;
  slug: string;
  date: Date;
  location: string;
};

export async function listMyParticipations(req: Request, res: Response): Promise<void> {
  const docs = await Participation.find({
    userId: req.session.userId,
    status: "registered",
  }).populate("eventId", "title slug date location");

  const cutoff = startOfTodayUTC();
  const items: {
    id: unknown;
    status: string;
    registeredAt: Date;
    event: { id: unknown; title: string; slug: string; date: Date; location: string };
  }[] = [];

  for (const doc of docs) {
    const ev = doc.eventId as unknown as PopulatedEvent | null;
    // Event was deleted: skip it instead of crashing.
    if (!ev || !ev.date) continue;
    items.push({
      id: doc._id,
      status: doc.status,
      registeredAt: doc.registeredAt,
      event: {
        id: ev._id,
        title: ev.title,
        slug: ev.slug,
        date: ev.date,
        location: ev.location,
      },
    });
  }

  const upcoming = items
    .filter((i) => i.event.date >= cutoff)
    .sort((a, b) => a.event.date.getTime() - b.event.date.getTime());
  const past = items
    .filter((i) => i.event.date < cutoff)
    .sort((a, b) => b.event.date.getTime() - a.event.date.getTime());

  res.json({ success: true, data: { upcoming, past } });
}