import { Types } from "mongoose";
import { Participation } from "../models/Participation";

type EventId = string | Types.ObjectId;

// Statuses that hold a spot. Pending counts so nobody can sneak past a full event.
export const ACTIVE_STATUSES = ["registered", "pending"] as const;

export async function getGuestCounts(
  eventId: EventId
): Promise<{ registered: number; pending: number }> {
  const [registered, pending] = await Promise.all([
    Participation.countDocuments({ eventId, status: "registered" as const }),
    Participation.countDocuments({ eventId, status: "pending" as const }),
  ]);
  return { registered, pending };
}

export async function countTaken(eventId: EventId): Promise<number> {
  const { registered, pending } = await getGuestCounts(eventId);
  return registered + pending;
}

// True when no spot is left. No capacity (null/undefined) means unlimited.
export async function isAtCapacity(
  eventId: EventId,
  capacity: number | null | undefined
): Promise<boolean> {
  if (typeof capacity !== "number") return false;
  return (await countTaken(eventId)) >= capacity;
}

// True when MORE people hold spots than allowed. Used after a write to detect a race.
export async function isOverCapacity(
  eventId: EventId,
  capacity: number | null | undefined
): Promise<boolean> {
  if (typeof capacity !== "number") return false;
  return (await countTaken(eventId)) > capacity;
}