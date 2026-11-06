import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import { Event } from "../models/Event";
import { Participation } from "../models/Participation";
import { ACTIVE_STATUSES, isAtCapacity, isOverCapacity } from "../utils/registration";
import { startOfTodayIST } from "../utils/istDay";

function fail(res: Response, code: number, message: string): void {
  res.status(code).json({ success: false, message });
}

export async function participate(req: Request, res: Response): Promise<void> {
  const eventId = String(req.params.id);
  if (!isValidObjectId(eventId)) return fail(res, 404, "Event not found.");

  const event = await Event.findById(eventId).select(
    "date capacity requireApproval registrationOpen"
  );
  if (!event) return fail(res, 404, "Event not found.");

  if (event.date < startOfTodayIST()) {
    return fail(res, 400, "This event has already taken place.");
  }

  // Old events have no registrationOpen field; only an explicit false closes them.
  if (event.registrationOpen === false) {
    return fail(res, 403, "Registration is closed.");
  }

  const userId = req.session.userId;
  const existing = await Participation.findOne({ userId, eventId });

  if (existing?.status === "registered") {
    return fail(res, 409, "You are already registered for this event.");
  }
  if (existing?.status === "pending") {
    return fail(res, 409, "Your request is already waiting for approval.");
  }
  if (existing?.status === "declined") {
    return fail(res, 403, "The host has declined your registration.");
  }

  if (await isAtCapacity(eventId, event.capacity)) {
    return fail(res, 409, "This event is full.");
  }

  const nextStatus = event.requireApproval
    ? ("pending" as const)
    : ("registered" as const);
  const message = event.requireApproval
    ? "Request sent. Waiting for approval."
    : "You're registered.";

  if (existing) {
    // Cancelled before: reuse the SAME document.
    const previousRegisteredAt = existing.registeredAt;
    existing.status = nextStatus;
    existing.registeredAt = new Date();
    existing.checkedInAt = null;
    await existing.save();

    // Race guard: if someone else took the last spot at the same moment, undo ours.
    if (await isOverCapacity(eventId, event.capacity)) {
      existing.status = "cancelled";
      existing.registeredAt = previousRegisteredAt;
      await existing.save();
      return fail(res, 409, "This event is full.");
    }

    res.json({ success: true, data: { status: existing.status }, message });
    return;
  }

  try {
    const created = await Participation.create({
      userId,
      eventId,
      status: nextStatus,
    });

    if (await isOverCapacity(eventId, event.capacity)) {
      await Participation.deleteOne({ _id: created._id });
      return fail(res, 409, "This event is full.");
    }

    res.status(201).json({
      success: true,
      data: { status: created.status },
      message,
    });
  } catch (err) {
    // Two requests raced past findOne: the unique index stopped the second one.
    if ((err as { code?: number }).code === 11000) {
      return fail(res, 409, "You already have a registration for this event.");
    }
    throw new Error("Could not register for event.", { cause: err });
  }
}

export async function cancelParticipation(req: Request, res: Response): Promise<void> {
  const eventId = String(req.params.id);
  if (!isValidObjectId(eventId)) return fail(res, 404, "Event not found.");

  const existing = await Participation.findOne({
    userId: req.session.userId,
    eventId,
  });

  if (!existing) {
    return fail(res, 404, "You are not registered for this event.");
  }
  if (existing.status === "cancelled") {
    return fail(res, 400, "Your registration is already cancelled.");
  }
  if (existing.status === "declined") {
    return fail(res, 400, "Your registration was declined by the host.");
  }

  existing.status = "cancelled";
  existing.checkedInAt = null;
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

// The meeting link is private. Only a CONFIRMED guest ("registered") of an
// online event can read it. Pending, declined and cancelled guests get 403.
export async function getMeetingLink(req: Request, res: Response): Promise<void> {
  const eventId = String(req.params.id);
  if (!isValidObjectId(eventId)) return fail(res, 404, "Event not found.");

  const [event, participation] = await Promise.all([
    Event.findById(eventId).select("locationType meetingUrl"),
    Participation.findOne({ userId: req.session.userId, eventId }).select(
      "status"
    ),
  ]);

  if (!event) return fail(res, 404, "Event not found.");

  if (!participation || participation.status !== "registered") {
    return fail(res, 403, "Only confirmed guests can see the meeting link.");
  }

  if (event.locationType !== "online" || !event.meetingUrl) {
    return fail(res, 404, "This event has no meeting link.");
  }

  res.set("Cache-Control", "no-store");
  res.json({ success: true, data: { meetingUrl: event.meetingUrl } });
}

type PopulatedEvent = {
  _id: unknown;
  title: string;
  slug: string;
  date: Date;
  endDate?: Date | null;
  timezone?: string;
  location: string;
};

export async function listMyParticipations(req: Request, res: Response): Promise<void> {
  const docs = await Participation.find({
    userId: req.session.userId,
    status: { $in: [...ACTIVE_STATUSES] },
  }).populate("eventId", "title slug date endDate timezone location");

  const cutoff = startOfTodayIST();
  const items: {
    id: unknown;
    status: string;
    registeredAt: Date;
    event: {
      id: unknown;
      title: string;
      slug: string;
      date: Date;
      endDate: Date | null;
      timezone: string;
      location: string;
    };
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
        endDate: ev.endDate ?? null,
        timezone: ev.timezone ?? "",
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