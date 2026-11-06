import { useState } from "react";
import { Link } from "react-router-dom";
import { type EventRecord, formatEventWhen } from "../api/events";
import { imageUrl } from "../api/images";
import CopyButton from "./CopyButton";
import { getTheme } from "./eventTheme";

type Props = {
  event: EventRecord;
  base: string; // e.g. /adminn/events/<id>
};

function mapUrl(lat: number, lng: number): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
}

const cardClass =
  "rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition-colors hover:bg-white/[0.07]";

export default function EventOverview({ event, base }: Props) {
  const theme = getTheme(event.theme);
  const publicLink = `${window.location.origin}/hype-lab/${event.slug}`;
  const isOnline = event.locationType === "online";
  const hasPin =
    typeof event.lat === "number" && typeof event.lng === "number";
  const isPrivate = event.visibility === "private";
  const going = event.registeredCount ?? 0;
  const pending = event.pendingCount ?? 0;
  const registrationOpen = event.registrationOpen !== false;
  const hasTime = Boolean(event.timezone);
  const [shareNote, setShareNote] = useState("");

  const missingLocation = isOnline
    ? !event.meetingUrl
    : !event.location.trim();

  const shareText = `${event.title} ${publicLink}`;
  const socials = [
    {
      name: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
    },
    {
      name: "X",
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        publicLink,
      )}&text=${encodeURIComponent(event.title)}`,
    },
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        publicLink,
      )}`,
    },
    {
      name: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        publicLink,
      )}`,
    },
  ];

  async function handleShare() {
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: event.title, url: publicLink });
        return;
      }
      await navigator.clipboard.writeText(publicLink);
      setShareNote("Link copied");
      setTimeout(() => setShareNote(""), 2000);
    } catch {
      // user closed the share sheet or clipboard was blocked, nothing to do
    }
  }

  return (
    <div className="space-y-5">
      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Link to={`${base}/blasts`} className={cardClass}>
          <p className="font-semibold">Send a Blast</p>
          <p className="mt-0.5 text-xs text-white/45">
            Email people who signed up
          </p>
        </Link>
        <button type="button" onClick={handleShare} className={cardClass}>
          <p className="font-semibold">Share Event</p>
          <p className="mt-0.5 text-xs text-white/45">
            {shareNote || "Share or copy the public link"}
          </p>
        </button>
        <a
          href={publicLink}
          target="_blank"
          rel="noreferrer"
          className={cardClass}
        >
          <p className="font-semibold">Event Page &#8599;</p>
          <p className="mt-0.5 text-xs text-white/45">
            Open the public page
          </p>
        </a>
      </div>

      {/* Preview + When & Where */}
      <div className="grid gap-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:grid-cols-2 sm:p-6">
        <div>
          <div
            className="rounded-2xl border border-white/10 p-3"
            style={{ background: theme.background }}
          >
            {event.coverImage ? (
              <img
                src={imageUrl(event.coverImage, 800)}
                alt=""
                className="aspect-video w-full rounded-xl object-cover"
              />
            ) : (
              <div className="aspect-video w-full rounded-xl bg-white/10" />
            )}
            <p className="mt-3 text-lg font-semibold leading-snug">
              {event.title}
            </p>
            <p className="mt-1 text-sm text-white/70">
              {formatEventWhen(event)}
            </p>
            <p className="mt-0.5 text-sm" style={{ color: theme.accent }}>
              {isOnline ? "Online" : event.location || "No location"}
            </p>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <input
              readOnly
              value={publicLink}
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm text-white/70 outline-none ring-1 ring-transparent focus:ring-white/30"
            />
            <CopyButton text={publicLink} />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {socials.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/15"
              >
                {s.name}
              </a>
            ))}
          </div>

          <p className="mt-4 text-xs text-white/45">
            Hosted by{" "}
            <span className="font-semibold text-white/70">OneHype Media</span>
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold">When &amp; Where</h2>

          <p className="mt-4 text-white/90">{formatEventWhen(event)}</p>
          {!hasTime && (
            <p className="mt-1 text-sm text-amber-300/90">
              No start time set. Edit the event to add one.
            </p>
          )}

          {isOnline ? (
            <div className="mt-4">
              <p className="text-white/90">Online</p>
              {event.meetingUrl && (
                <div className="mt-2">
                  <p className="text-xs text-white/45">
                    Meeting link (only you can see this)
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <a
                      href={event.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="min-w-0 flex-1 truncate text-sm text-white/70 underline-offset-2 hover:text-white hover:underline"
                    >
                      {event.meetingUrl}
                    </a>
                    <CopyButton text={event.meetingUrl} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-white/90">{event.location || "No location"}</p>
              {hasPin && (
                <a
                  href={mapUrl(event.lat as number, event.lng as number)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-sm text-white/60 underline-offset-2 hover:text-white hover:underline"
                >
                  Open map &#8599;
                </a>
              )}
            </div>
          )}

          {missingLocation && (
            <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3">
              <p className="text-sm font-semibold text-amber-200">
                {isOnline ? "Meeting link missing" : "Location missing"}
              </p>
              <p className="mt-0.5 text-xs text-amber-200/80">
                {isOnline
                  ? "Guests won't have a link to join."
                  : "Guests won't know where to go."}
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              to={`${base}/edit`}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-white/90"
            >
              Edit Event
            </Link>
            <Link
              to={`${base}/edit`}
              className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
            >
              Change Photo
            </Link>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Link
          to={`${base}/guests`}
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-colors hover:bg-white/[0.07]"
        >
          <p className="text-sm text-white/55">Guests</p>
          <p className="mt-1 text-2xl font-semibold">
            {going} going
            {typeof event.capacity === "number" && (
              <span className="text-base font-normal text-white/45">
                {" "}
                &middot; capacity {event.capacity}
              </span>
            )}
          </p>
          {pending > 0 && (
            <p className="mt-2 text-sm text-amber-300">
              {pending} waiting for approval
            </p>
          )}
        </Link>

        <Link
          to={`${base}/registration`}
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-colors hover:bg-white/[0.07]"
        >
          <p className="text-sm text-white/55">Registration</p>
          <p className="mt-1 text-2xl font-semibold">
            {registrationOpen ? "Open" : "Closed"}
          </p>
          <p className="mt-2 text-xs text-white/45">
            Free &middot;{" "}
            {event.requireApproval ? "approval required" : "instant sign-up"}
          </p>
        </Link>
      </div>

      {/* Visibility */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <div>
          <p className="text-sm text-white/55">Visibility</p>
          <p className="mt-1 font-semibold">
            {isPrivate ? "Private" : "Public"}
          </p>
          <p className="mt-1 text-xs text-white/45">
            {isPrivate
              ? "Not listed on the site. Anyone with the link can open it."
              : "Listed on the site for everyone."}
          </p>
        </div>
        <Link
          to={`${base}/edit`}
          className="shrink-0 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
        >
          Change
        </Link>
      </div>
    </div>
  );
}