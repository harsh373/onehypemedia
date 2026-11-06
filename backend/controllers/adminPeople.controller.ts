import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import { User } from "../models/User";
import { Event } from "../models/Event";
import { Participation } from "../models/Participation";
import { isAtCapacity } from "../utils/registration";
import { sendParticipationEmail } from "../utils/participationEmail";

const STATUSES = ["registered", "pending", "declined", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

// Admin can set these. "pending" only comes from a guest asking to join.
const ADMIN_STATUSES = ["registered", "declined", "cancelled"] as const;
type AdminStatus = (typeof ADMIN_STATUSES)[number];

function isStatus(value: unknown): value is Status {
  return (
    typeof value === "string" && (STATUSES as readonly string[]).includes(value)
  );
}

function isAdminStatus(value: unknown): value is AdminStatus {
  return (
    typeof value === "string" &&
    (ADMIN_STATUSES as readonly string[]).includes(value)
  );
}

function fail(res: Response, code: number, message: string): void {
  res.status(code).json({ success: false, message });
}

type UserLike = {
  _id: unknown;
  name: string;
  username: string;
  email: string;
  phone?: string;
  bio?: string;
  location?: string;
  createdAt?: Date;
};

function shapeUser(user: UserLike, registeredCount: number) {
  return {
    id: String(user._id),
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone ?? "",
    bio: user.bio ?? "",
    location: user.location ?? "",
    createdAt: user.createdAt,
    registeredCount,
  };
}

export async function listUsers(_req: Request, res: Response): Promise<void> {
  const users = await User.find().sort({ createdAt: -1 });

  const counts = await Participation.aggregate<{ _id: unknown; count: number }>([
    { $match: { status: "registered" } },
    { $group: { _id: "$userId", count: { $sum: 1 } } },
  ]);
  const countByUser = new Map<string, number>();
  for (const row of counts) countByUser.set(String(row._id), row.count);

  const data = users.map((user) =>
    shapeUser(user, countByUser.get(String(user._id)) ?? 0)
  );
  res.json({ success: true, data });
}

type PopulatedEvent = {
  _id: unknown;
  title: string;
  slug: string;
  date: Date;
};

type UserParticipationRow = {
  _id: unknown;
  status: Status;
  registeredAt: Date;
  eventId: PopulatedEvent | null;
};

export async function getUser(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!isValidObjectId(id)) return fail(res, 400, "Invalid user ID.");

  const user = await User.findById(id);
  if (!user) return fail(res, 404, "User not found.");

  const rows = (await Participation.find({ userId: user._id })
    .sort({ registeredAt: -1 })
    .populate("eventId", "title slug date")
    .lean()) as unknown as UserParticipationRow[];

  const participations = rows
    .filter((row) => row.eventId !== null)
    .map((row) => ({
      id: String(row._id),
      status: row.status,
      registeredAt: row.registeredAt,
      event: {
        id: String(row.eventId!._id),
        title: row.eventId!.title,
        slug: row.eventId!.slug,
        date: row.eventId!.date,
      },
    }));

  const registeredCount = participations.filter(
    (p) => p.status === "registered"
  ).length;

  res.json({
    success: true,
    data: { ...shapeUser(user, registeredCount), participations },
  });
}

type PopulatedUser = {
  _id: unknown;
  name: string;
  username: string;
  email: string;
  phone?: string;
};

type EventParticipationRow = {
  _id: unknown;
  status: Status;
  registeredAt: Date;
  checkedInAt?: Date | null;
  userId: PopulatedUser | null;
};

export async function listEventParticipants(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params;
  if (!isValidObjectId(id)) return fail(res, 400, "Invalid event ID.");

  const statusParam = req.query.status;
  let status: Status | undefined;
  if (statusParam !== undefined) {
    if (!isStatus(statusParam)) {
      return fail(
        res,
        400,
        "Status must be 'registered', 'pending', 'declined' or 'cancelled'."
      );
    }
    status = statusParam;
  }

  const event = await Event.findById(id).select("_id");
  if (!event) return fail(res, 404, "Event not found.");

  const rows = (await Participation.find({
    eventId: event._id,
    ...(status ? { status } : {}),
  })
    .sort({ registeredAt: -1 })
    .populate("userId", "name username email phone")
    .lean()) as unknown as EventParticipationRow[];

  const data = rows
    .filter((row) => row.userId !== null)
    .map((row) => ({
      id: String(row._id),
      status: row.status,
      registeredAt: row.registeredAt,
      checkedInAt: row.checkedInAt ?? null,
      user: {
        id: String(row.userId!._id),
        name: row.userId!.name,
        username: row.userId!.username,
        email: row.userId!.email,
        phone: row.userId!.phone ?? "",
      },
    }));

  res.json({ success: true, data });
}

// Approve email: any move into "registered" from another status.
// Decline email: only when the guest was waiting for approval.
// Cancel and declining an already confirmed guest stay silent.
async function emailGuestIfNeeded(
  previous: Status,
  next: AdminStatus,
  userId: unknown,
  eventId: unknown
): Promise<void> {
  const kind =
    next === "registered" && previous !== "registered"
      ? "approved"
      : next === "declined" && previous === "pending"
        ? "declined"
        : null;
  if (!kind) return;

  try {
    const [user, event] = await Promise.all([
      User.findById(userId).select("name email").lean(),
      Event.findById(eventId)
        .select("title slug date timezone location locationType")
        .lean(),
    ]);
    if (!user || !event) return;

    await sendParticipationEmail(kind, user.email, user.name, {
      title: event.title,
      slug: event.slug,
      date: event.date,
      timezone: event.timezone,
      location: event.location,
      locationType: event.locationType,
    });
  } catch (err) {
    console.error("Could not prepare guest email:", err);
  }
}

export async function updateParticipation(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params;
  if (!isValidObjectId(id)) return fail(res, 400, "Invalid participation ID.");

  const status: unknown = req.body?.status;
  if (!isAdminStatus(status)) {
    return fail(
      res,
      400,
      "Status must be 'registered', 'declined' or 'cancelled'."
    );
  }

  const existing = await Participation.findById(id).select("status eventId");
  if (!existing) return fail(res, 404, "Participation not found.");

  // Approving a PENDING guest needs no check: they already hold a spot.
  // Bringing back a cancelled/declined guest takes a new spot, so check capacity.
  const alreadyHoldsSpot =
    existing.status === "registered" || existing.status === "pending";
  if (status === "registered" && !alreadyHoldsSpot) {
    const event = await Event.findById(existing.eventId).select("capacity");
    if (await isAtCapacity(existing.eventId, event?.capacity)) {
      return fail(
        res,
        409,
        "This event is full. Raise the capacity in the Registration tab first."
      );
    }
  }

  // Only a confirmed guest can be checked in, so any other status clears check-in.
  const update: { status: Status; checkedInAt?: null } = { status };
  if (status !== "registered") update.checkedInAt = null;

  const participation = await Participation.findByIdAndUpdate(id, update, {
    new: true,
  });
  if (!participation) return fail(res, 404, "Participation not found.");

  // Status is already saved. Awaited so Vercel doesn't freeze the function
  // before the mail goes out; it never throws and gives up after 8 seconds.
  await emailGuestIfNeeded(
    existing.status,
    status,
    participation.userId,
    participation.eventId
  );

  res.json({
    success: true,
    data: {
      id: String(participation._id),
      status: participation.status,
      checkedInAt: participation.checkedInAt ?? null,
    },
    message: "Participation updated.",
  });
}

export async function checkInParticipation(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params;
  if (!isValidObjectId(id)) return fail(res, 400, "Invalid participation ID.");

  const checkedIn: unknown = req.body?.checkedIn;
  if (typeof checkedIn !== "boolean") {
    return fail(res, 400, "checkedIn must be true or false.");
  }

  const existing = await Participation.findById(id).select("status checkedInAt");
  if (!existing) return fail(res, 404, "Participation not found.");

  if (checkedIn && existing.status !== "registered") {
    return fail(res, 409, "Only registered guests can be checked in.");
  }

  // Keep the original check-in time if they are already checked in.
  const checkedInAt = checkedIn ? (existing.checkedInAt ?? new Date()) : null;

  const updated = await Participation.findByIdAndUpdate(
    id,
    { checkedInAt },
    { new: true }
  );
  if (!updated) return fail(res, 404, "Participation not found.");

  res.json({
    success: true,
    data: { id: String(updated._id), checkedInAt: updated.checkedInAt ?? null },
    message: checkedIn ? "Guest checked in." : "Check-in removed.",
  });
}

export async function deleteParticipation(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params;
  if (!isValidObjectId(id)) return fail(res, 400, "Invalid participation ID.");

  const participation = await Participation.findByIdAndDelete(id);
  if (!participation) return fail(res, 404, "Participation not found.");

  res.json({ success: true, message: "Participation removed." });
}