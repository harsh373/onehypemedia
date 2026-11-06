import { env } from "../config/env";
import { isMailConfigured, sendMail } from "./mailer";

export type EmailEvent = {
  title: string;
  slug: string;
  date: Date;
  timezone?: string;
  location: string;
  locationType?: string;
};

type Kind = "approved" | "declined";

const MAIL_TIMEOUT_MS = 8000;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// A set timezone means the admin picked a start time, same rule as the frontend.
function formatWhen(event: EventSummary): string {
  const date = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(event.date);

  if (!event.timezone) return date;

  const time = new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(event.date);

  return `${date}, ${time} IST`;
}

type EventSummary = EmailEvent;

function buildWhere(event: EventSummary): string {
  return event.locationType === "online" ? "Online" : event.location;
}

function eventLink(slug: string): string {
  const base = env.clientUrl.replace(/\/+$/, "");
  return `${base}/hype-lab/${slug}`;
}

function buildApproved(name: string, event: EventSummary) {
  const when = formatWhen(event);
  const where = buildWhere(event);
  const link = eventLink(event.slug);
  const online = event.locationType === "online";

  const extra = online
    ? "Your meeting link is on the event page once you are logged in."
    : "";

  const text = [
    `Hi ${name},`,
    "",
    `You're confirmed for ${event.title}.`,
    "",
    `When: ${when}`,
    `Where: ${where}`,
    extra,
    "",
    `Event page: ${link}`,
    "",
    "See you there,",
    "OneHype Media",
  ]
    .filter((line, i, arr) => line !== "" || arr[i - 1] !== "")
    .join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#111;">
      <p>Hi ${escapeHtml(name)},</p>
      <p>You're confirmed for <strong>${escapeHtml(event.title)}</strong>.</p>
      <p style="margin:16px 0;">
        <strong>When:</strong> ${escapeHtml(when)}<br />
        <strong>Where:</strong> ${escapeHtml(where)}
      </p>
      ${extra ? `<p>${escapeHtml(extra)}</p>` : ""}
      <p>
        <a href="${escapeHtml(link)}" style="display:inline-block;background:#e31d25;color:#fff;padding:10px 18px;text-decoration:none;font-weight:bold;">
          View event
        </a>
      </p>
      <p style="color:#666;font-size:13px;">See you there,<br />OneHype Media</p>
    </div>`;

  return { subject: `You're confirmed: ${event.title}`, text, html };
}

function buildDeclined(name: string, event: EventSummary) {
  const text = [
    `Hi ${name},`,
    "",
    `Thanks for your interest in ${event.title}. Unfortunately we are not able to confirm your spot this time.`,
    "",
    "We hope to see you at a future event.",
    "",
    "OneHype Media",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#111;">
      <p>Hi ${escapeHtml(name)},</p>
      <p>Thanks for your interest in <strong>${escapeHtml(event.title)}</strong>. Unfortunately we are not able to confirm your spot this time.</p>
      <p>We hope to see you at a future event.</p>
      <p style="color:#666;font-size:13px;">OneHype Media</p>
    </div>`;

  return { subject: `Update on your registration: ${event.title}`, text, html };
}

// Never throws. A mail problem must not undo or fail the status change.
export async function sendParticipationEmail(
  kind: Kind,
  to: string,
  name: string,
  event: EventSummary
): Promise<void> {
  if (!isMailConfigured()) return;

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const content =
      kind === "approved"
        ? buildApproved(name, event)
        : buildDeclined(name, event);

    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error("Mail send timed out")),
        MAIL_TIMEOUT_MS
      );
    });

    await Promise.race([sendMail({ to, ...content }), timeout]);
  } catch (err) {
    console.error(`Could not send ${kind} email:`, err);
  } finally {
    if (timer) clearTimeout(timer);
  }
}