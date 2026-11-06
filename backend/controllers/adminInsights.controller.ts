import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import { Event } from "../models/Event";
import { Participation } from "../models/Participation";

const TIMEZONE = "Asia/Kolkata";

type StatusRow = { _id: string; count: number; checkedIn: number };
type DayRow = { _id: string; count: number };

export async function getInsights(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    res.status(400).json({ success: false, message: "Invalid event ID." });
    return;
  }

  const event = await Event.findById(id).select("capacity").lean();
  if (!event) {
    res.status(404).json({ success: false, message: "Event not found." });
    return;
  }

  const [statusRows, dayRows] = await Promise.all([
    // One row per status, plus how many of them have a check-in time.
    Participation.aggregate<StatusRow>([
      { $match: { eventId: event._id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          checkedIn: {
            $sum: { $cond: [{ $ne: ["$checkedInAt", null] }, 1, 0] },
          },
        },
      },
    ]),
    // Sign-ups per IST day. Counts "registered" (Going) + "pending" guests only.
    // Declined and cancelled guests are not counted as sign-ups in the chart.
    Participation.aggregate<DayRow>([
      {
        $match: { eventId: event._id, status: { $in: ["registered", "pending"] } },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$registeredAt",
              timezone: TIMEZONE,
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const statusBreakdown = { registered: 0, pending: 0, declined: 0, cancelled: 0 };
  let checkedIn = 0;
  for (const row of statusRows) {
    if (row._id in statusBreakdown) {
      statusBreakdown[row._id as keyof typeof statusBreakdown] = row.count;
    }
    if (row._id === "registered") checkedIn = row.checkedIn;
  }

  const capacity = event.capacity ?? null;
  const taken = statusBreakdown.registered + statusBreakdown.pending;
  const fillPercent = capacity ? Math.round((taken / capacity) * 100) : null;

  res.json({
    success: true,
    data: {
      today: new Date().toLocaleDateString("en-CA", { timeZone: TIMEZONE }),
      statusBreakdown,
      checkedIn,
      capacity,
      taken,
      fillPercent,
      registrationsByDay: dayRows.map((row) => ({
        day: row._id,
        count: row.count,
      })),
    },
  });
}