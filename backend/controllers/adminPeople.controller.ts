import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import { User } from "../models/User";
import { Event } from "../models/Event";
import { Participation } from "../models/Participation";

const STATUSES = ["registered", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

function isStatus(value: unknown): value is Status {
  return (
    typeof value === "string" && (STATUSES as readonly string[]).includes(value)
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
      return fail(res, 400, "Status must be 'registered' or 'cancelled'.");
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

export async function updateParticipation(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params;
  if (!isValidObjectId(id)) return fail(res, 400, "Invalid participation ID.");

  const status: unknown = req.body?.status;
  if (!isStatus(status)) {
    return fail(res, 400, "Status must be 'registered' or 'cancelled'.");
  }

  const participation = await Participation.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );
  if (!participation) return fail(res, 404, "Participation not found.");

  res.json({
    success: true,
    data: { id: String(participation._id), status: participation.status },
    message: "Participation updated.",
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