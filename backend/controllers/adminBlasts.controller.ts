import { Request, Response } from "express";
import { isValidObjectId, type Types } from "mongoose";
import { env } from "../config/env";
import { Event } from "../models/Event";
import { Participation } from "../models/Participation";
import { Blast } from "../models/Blast";
import { getAdminEmail, isMailConfigured, sendMail } from "../utils/mailer";

const AUDIENCES = ["registered", "pending", "all-active"] as const;
type Audience = (typeof AUDIENCES)[number];

const MAX_RECIPIENTS = 200; // Vercel kills long requests, so we cap the size.
const BATCH_SIZE = 50;
const SENDING_GUARD_MS = 2 * 60 * 1000;
const TIMEZONE = "Asia/Kolkata";
const NOT_CONFIGURED = "Email is not configured on the server.";

function isAudience(value: unknown): value is Audience {
  return (
    typeof value === "string" && (AUDIENCES as readonly string[]).includes(value)
  );
}

function fail(res: Response, code: number, message: string): void {
  res.status(code).json({ success: false, message });
}

type RecipientRow = {
  status: "registered" | "pending";
  userId: { email?: string } | null;
};

// Distinct, lowercase emails for each audience.
async function loadRecipients(
  eventId: Types.ObjectId
): Promise<Record<Audience, string[]>> {
  const rows = (await Participation.find({
    eventId,
    status: { $in: ["registered" as const, "pending" as const] },
  })
    .select("status userId")
    .populate("userId", "email")
    .lean()) as unknown as RecipientRow[];

  const registered = new Set<string>();
  const pending = new Set<string>();

  for (const row of rows) {
    const email = row.userId?.email?.trim().toLowerCase();
    if (!email) continue;
    if (row.status === "registered") registered.add(email);
    else pending.add(email);
  }

  return {
    registered: [...registered],
    pending: [...pending],
    "all-active": [...new Set([...registered, ...pending])],
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function dateText(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TIMEZONE,
  });
}

function timeText(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: TIMEZONE,
  });
}

type EmailEvent = {
  title: string;
  slug: string;
  date: Date;
  endDate?: Date | null;
  timezone?: string;
};

// Same wording as the admin UI: "27 Oct 2026 · 12:30 AM – 1:30 AM IST".
// Old events without a time show only the date.
function whenText(event: EmailEvent): string {
  if (!event.timezone) return dateText(event.date);

  let text = `${dateText(event.date)} · ${timeText(event.date)}`;
  if (event.endDate) {
    text +=
      dateText(event.endDate) === dateText(event.date)
        ? ` – ${timeText(event.endDate)}`
        : ` – ${dateText(event.endDate)}, ${timeText(event.endDate)}`;
  }
  return `${text} IST`;
}

function buildContent(event: EmailEvent, body: string) {
  const link = `${env.clientUrl.replace(/\/+$/, "")}/hype-lab/${event.slug}`;
  const when = whenText(event);

  const text = `${body}\n\n---\n${event.title}\n${when}\n${link}\n`;

  const html =
    `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#111;">` +
    `<div>${escapeHtml(body).replace(/\r?\n/g, "<br>")}</div>` +
    `<hr style="border:none;border-top:1px solid #ddd;margin:24px 0;">` +
    `<p style="font-size:13px;color:#666;margin:0;">` +
    `<strong>${escapeHtml(event.title)}</strong><br>` +
    `${escapeHtml(when)}<br>` +
    `<a href="${escapeHtml(link)}">${escapeHtml(link)}</a>` +
    `</p></div>`;

  return { text, html };
}

function finalStatus(sent: number, failed: number): "sent" | "partial" | "failed" {
  if (failed === 0) return "sent";
  return sent === 0 ? "failed" : "partial";
}

export async function listBlasts(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!isValidObjectId(id)) return fail(res, 400, "Invalid event ID.");

  const event = await Event.findById(id).select("_id");
  if (!event) return fail(res, 404, "Event not found.");

  const [blasts, recipients] = await Promise.all([
    Blast.find({ eventId: event._id })
      .select("-body -__v")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
    loadRecipients(event._id),
  ]);

  res.json({
    success: true,
    data: {
      blasts,
      counts: {
        registered: recipients.registered.length,
        pending: recipients.pending.length,
        "all-active": recipients["all-active"].length,
      },
      limit: MAX_RECIPIENTS,
      mailConfigured: isMailConfigured(),
    },
  });
}

export async function sendBlast(req: Request, res: Response): Promise<void> {
  if (!isMailConfigured()) return fail(res, 503, NOT_CONFIGURED);

  const { id } = req.params;
  if (!isValidObjectId(id)) return fail(res, 400, "Invalid event ID.");

  const input = (req.body ?? {}) as Record<string, unknown>;

  // Line breaks are removed from the subject so nobody can inject mail headers.
  const subject =
    typeof input.subject === "string"
      ? input.subject.replace(/[\r\n]+/g, " ").trim()
      : "";
  const body = typeof input.body === "string" ? input.body.trim() : "";
  const testOnly = input.testOnly === true;

  if (subject.length < 1 || subject.length > 150) {
    return fail(res, 400, "Subject must be 1 to 150 characters.");
  }
  if (body.length < 1 || body.length > 5000) {
    return fail(res, 400, "Message must be 1 to 5000 characters.");
  }
  if (!isAudience(input.audience)) {
    return fail(res, 400, "Choose who should receive this message.");
  }
  const audience = input.audience;

  const event = await Event.findById(id)
    .select("title slug date endDate timezone")
    .lean();
  if (!event) return fail(res, 404, "Event not found.");

  const content = buildContent(event, body);

  // Test mode: only the admin gets it, and nothing is saved.
  if (testOnly) {
    const to = getAdminEmail();
    if (!to) return fail(res, 503, NOT_CONFIGURED);
    try {
      await sendMail({ to, subject: `[TEST] ${subject}`, ...content });
    } catch (err) {
      console.error("Test email failed:", err);
      return fail(
        res,
        502,
        "Could not send the test email. Check the SMTP settings on the server."
      );
    }
    res.json({
      success: true,
      data: { blast: null, testSentTo: to },
      message: `Test sent to ${to}.`,
    });
    return;
  }

  const recipients = (await loadRecipients(event._id))[audience];
  if (recipients.length === 0) {
    return fail(res, 400, "There are no guests in this audience.");
  }
  if (recipients.length > MAX_RECIPIENTS) {
    return fail(
      res,
      400,
      `A blast can reach at most ${MAX_RECIPIENTS} guests. This audience has ${recipients.length}.`
    );
  }

  // Double-click guard: one blast at a time per event.
  const busy = await Blast.findOne({
    eventId: event._id,
    status: "sending" as const,
    createdAt: { $gt: new Date(Date.now() - SENDING_GUARD_MS) },
  }).select("_id");
  if (busy) {
    return fail(
      res,
      409,
      "A blast is already being sent for this event. Wait a moment."
    );
  }

  const blast = await Blast.create({
    eventId: event._id,
    subject,
    body,
    audience,
    recipientCount: recipients.length,
    sentCount: 0,
    failedCount: 0,
    status: "sending",
  });

  let sent = 0;
  let failed = 0;
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    try {
      await sendMail({ bcc: batch, subject, ...content });
      sent += batch.length;
    } catch (err) {
      // One bad batch must not stop the others.
      failed += batch.length;
      console.error("Blast batch failed:", err);
    }
  }

  const updated = await Blast.findByIdAndUpdate(
    blast._id,
    { sentCount: sent, failedCount: failed, status: finalStatus(sent, failed) },
    { new: true }
  )
    .select("-body -__v")
    .lean();

  res.json({
    success: true,
    data: { blast: updated, testSentTo: null },
    message: "Blast processed.",
  });
}