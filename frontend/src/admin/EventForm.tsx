import { useEffect, useState } from "react";
import { createEvent, getAdminEvent, updateEvent } from "../api/events";
import type {
  CoverPayload,
  EventInput,
  LocationType,
  Visibility,
} from "../api/events";
import { imageUrl } from "../api/images";
import type { CoverState, GalleryItem } from "../api/images";
import { uploadImage } from "../api/uploads";
import CoverImageField from "./CoverImageField";
import GalleryField from "./GalleryField";
import LocationPicker from "./LocationPicker";
import { THEMES, getTheme } from "./eventTheme";

type Props = {
  eventId: string | null;
  onDone: (message: string, eventId: string) => void;
  onCancel: () => void;
};

type FormState = {
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  locationType: LocationType;
  location: string;
  meetingUrl: string;
  lat: number | null;
  lng: number | null;
  capacity: string;
  requireApproval: boolean;
  visibility: Visibility;
  theme: string;
};

type Uploaded = { url: string; publicId: string };

const COVER_KEY = "__cover__";
const UPLOAD_CONCURRENCY = 3;

const TIMEZONE = "Asia/Kolkata";
const IST_OFFSET_MS = 330 * 60 * 1000;
// Old events were saved with only a date. When one is edited we need a time to show.
const LEGACY_DEFAULT_TIME = "18:00";

const card = "rounded-2xl bg-black/25 p-3 ring-1 ring-white/10";
const field =
  "rounded-lg bg-white/10 px-3 py-2 text-sm text-white outline-none ring-1 ring-transparent focus:ring-white/30 [color-scheme:dark] disabled:opacity-50";
const sectionLabel = "text-xs font-medium uppercase tracking-wider text-white/50";

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

// Splits a moment into its date and time as seen in India.
function istParts(d: Date): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

// Turns "2026-10-27" + "00:30" (India time) into the exact moment it means.
function toInstant(date: string, time: string): Date | null {
  if (!date || !time) return null;
  const d = new Date(`${date}T${time}:00+05:30`);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Next full hour in India time, plus one hour for the end.
function defaultTimes() {
  const hour = 3_600_000;
  const next = Math.ceil((Date.now() + IST_OFFSET_MS + 60_000) / hour) * hour - IST_OFFSET_MS;
  const start = istParts(new Date(next));
  const end = istParts(new Date(next + hour));
  return {
    startDate: start.date,
    startTime: start.time,
    endDate: end.date,
    endTime: end.time,
  };
}

function initialForm(): FormState {
  return {
    title: "",
    description: "",
    ...defaultTimes(),
    locationType: "in-person",
    location: "",
    meetingUrl: "",
    lat: null,
    lng: null,
    capacity: "",
    requireApproval: false,
    visibility: "public",
    theme: "minimal",
  };
}

// Runs tasks a few at a time. Waits for everything already started to finish
// before reporting a failure, so nothing keeps uploading in the background.
async function runTasks(
  tasks: Array<() => Promise<void>>,
  limit: number,
  onEach: () => void
): Promise<void> {
  let next = 0;
  let failed = false;
  let failure: unknown = null;

  const runners = Array.from(
    { length: Math.min(limit, tasks.length) },
    async () => {
      while (!failed && next < tasks.length) {
        const task = tasks[next++];
        try {
          await task();
          onEach();
        } catch (err) {
          if (!failed) {
            failed = true;
            failure = err;
          }
        }
      }
    }
  );

  await Promise.all(runners);

  if (failed) {
    throw failure instanceof Error
      ? failure
      : new Error("Failed to upload image.", { cause: failure });
  }
}

export default function EventForm({ eventId, onDone, onCancel }: Props) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [cover, setCover] = useState<CoverState>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(eventId !== null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const theme = getTheme(form.theme);

  useEffect(() => {
    if (!eventId) return;
    getAdminEvent(eventId)
      .then((ev) => {
        let startDate: string;
        let startTime: string;
        if (ev.timezone) {
          const p = istParts(new Date(ev.date));
          startDate = p.date;
          startTime = p.time;
        } else {
          startDate = ev.date.slice(0, 10);
          startTime = LEGACY_DEFAULT_TIME;
        }
        const end = ev.endDate ? istParts(new Date(ev.endDate)) : null;
        const online = ev.locationType === "online";

        setForm({
          title: ev.title,
          description: ev.description,
          startDate,
          startTime,
          endDate: end?.date ?? "",
          endTime: end?.time ?? "",
          locationType: online ? "online" : "in-person",
          location: online ? "" : ev.location,
          meetingUrl: ev.meetingUrl ?? "",
          lat: ev.lat ?? null,
          lng: ev.lng ?? null,
          capacity: ev.capacity ? String(ev.capacity) : "",
          requireApproval: ev.requireApproval ?? false,
          visibility: ev.visibility ?? "public",
          theme: ev.theme ?? "minimal",
        });

        if (ev.coverImage?.crop) {
          setCover({
            kind: "existing",
            url: ev.coverImage.url,
            publicId: ev.coverImage.publicId,
            crop: ev.coverImage.crop,
            previewUrl: imageUrl({
              url: ev.coverImage.url,
              crop: ev.coverImage.crop,
            }),
          });
        }

        const items: GalleryItem[] = [];
        for (const image of [...ev.gallery].sort((a, b) => a.order - b.order)) {
          if (!image.crop) continue;
          items.push({
            key: image.publicId,
            kind: "existing",
            url: image.url,
            publicId: image.publicId,
            crop: image.crop,
            previewUrl: imageUrl({ url: image.url, crop: image.crop }, 800),
          });
        }
        setGallery(items);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [eventId]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    // Check everything first, so nothing is uploaded for a form that cannot be saved.
    if (!form.title.trim()) return setError("Event name is required.");
    if (!form.description.trim()) return setError("Description is required.");

    const start = toInstant(form.startDate, form.startTime);
    if (!start) return setError("Start date and time are required.");

    let end: Date | null = null;
    if (form.endDate !== "" || form.endTime !== "") {
      end = toInstant(form.endDate, form.endTime);
      if (!end) {
        return setError("Enter both an end date and an end time, or remove the end.");
      }
      if (end.getTime() <= start.getTime()) {
        return setError("The end must be after the start.");
      }
    }

    if (form.locationType === "in-person") {
      if (!form.location.trim()) return setError("Location is required.");
    } else if (!isHttpUrl(form.meetingUrl.trim())) {
      return setError("Enter a valid meeting link, starting with https://");
    }

    const capacityText = form.capacity.trim();
    let capacity: number | null = null;
    if (capacityText !== "") {
      if (!/^\d+$/.test(capacityText) || Number(capacityText) < 1) {
        return setError("Capacity must be a whole number of 1 or more, or empty for unlimited.");
      }
      capacity = Number(capacityText);
    }

    if (!cover) return setError("Cover image is required.");

    const coverNew = cover.kind === "new" ? cover : null;
    const galleryNew = gallery.filter(
      (item): item is Extract<GalleryItem, { kind: "new" }> =>
        item.kind === "new"
    );
    const total = (coverNew ? 1 : 0) + galleryNew.length;

    setSaving(true);
    setError("");

    try {
      const uploaded = new Map<string, Uploaded>();

      if (total > 0) {
        let done = 0;
        const report = () =>
          setStatus(
            total > 1
              ? `Uploading ${done} of ${total} images...`
              : "Uploading image..."
          );
        report();

        const tasks: Array<() => Promise<void>> = [];

        if (coverNew) {
          tasks.push(async () => {
            const result = await uploadImage(coverNew.file);
            uploaded.set(COVER_KEY, result);
            URL.revokeObjectURL(coverNew.sourceUrl);
            setCover({
              kind: "existing",
              url: result.url,
              publicId: result.publicId,
              crop: coverNew.crop,
              previewUrl: coverNew.previewUrl,
            });
          });
        }

        for (const item of galleryNew) {
          tasks.push(async () => {
            const result = await uploadImage(item.file);
            uploaded.set(item.key, result);
            URL.revokeObjectURL(item.sourceUrl);
            setGallery((prev) =>
              prev.map((g) =>
                g.key === item.key
                  ? {
                      key: g.key,
                      kind: "existing",
                      url: result.url,
                      publicId: result.publicId,
                      crop: item.crop,
                      previewUrl: item.previewUrl,
                    }
                  : g
              )
            );
          });
        }

        await runTasks(tasks, UPLOAD_CONCURRENCY, () => {
          done += 1;
          report();
        });
      }

      let coverPayload: CoverPayload;
      if (cover.kind === "new") {
        const result = uploaded.get(COVER_KEY);
        if (!result) throw new Error("Failed to upload image.");
        coverPayload = { ...result, crop: cover.crop };
      } else {
        coverPayload = {
          url: cover.url,
          publicId: cover.publicId,
          crop: cover.crop,
        };
      }

      const galleryPayload: CoverPayload[] = gallery.map((item) => {
        if (item.kind === "existing") {
          return { url: item.url, publicId: item.publicId, crop: item.crop };
        }
        const result = uploaded.get(item.key);
        if (!result) throw new Error("Failed to upload image.");
        return { ...result, crop: item.crop };
      });

      setStatus("Saving event...");
      const online = form.locationType === "online";
      const payload: EventInput = {
        title: form.title.trim(),
        description: form.description.trim(),
        date: start.toISOString(),
        endDate: end ? end.toISOString() : null,
        timezone: TIMEZONE,
        locationType: form.locationType,
        location: online ? "Online" : form.location.trim(),
        meetingUrl: online ? form.meetingUrl.trim() : "",
        lat: online ? null : form.lat,
        lng: online ? null : form.lng,
        capacity,
        requireApproval: form.requireApproval,
        visibility: form.visibility,
        theme: form.theme,
        coverImage: coverPayload,
        gallery: galleryPayload,
      };

      if (eventId) {
        await updateEvent(eventId, payload);
        onDone("Event updated successfully.", eventId);
      } else {
        const saved = await createEvent(payload);
        onDone("Event created successfully.", saved._id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event.");
      setSaving(false);
      setStatus("");
    }
  }

  if (loading) {
    return <p className="text-white/55">Loading event...</p>;
  }

  const hasEnd = form.endDate !== "" || form.endTime !== "";

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-4xl">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">
        {eventId ? "Edit Event" : "Create Event"}
      </h1>

      <div
        className="rounded-3xl p-5 sm:p-8"
        style={{ background: theme.background }}
      >
        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          {/* Left: cover and theme */}
          <div>
            <CoverImageField value={cover} onChange={setCover} disabled={saving} />

            <div className="mt-6">
              <p className={sectionLabel}>Theme · {theme.label}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {THEMES.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    title={option.label}
                    aria-label={`${option.label} theme`}
                    disabled={saving}
                    onClick={() => set("theme", option.id)}
                    className={`h-8 w-8 rounded-full ring-2 transition ${
                      option.id === theme.id ? "ring-white" : "ring-white/15 hover:ring-white/40"
                    }`}
                    style={{ background: option.swatch }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right: details */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-end gap-3">
              <label htmlFor="visibility" className="sr-only">
                Visibility
              </label>
              <select
                id="visibility"
                value={form.visibility}
                disabled={saving}
                onChange={(e) => set("visibility", e.target.value as Visibility)}
                className={`${field} cursor-pointer`}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
            <p className="-mt-2 text-right text-xs text-white/45">
              {form.visibility === "public"
                ? "Listed on the website's Upcoming Events."
                : "Hidden from lists. Anyone with the link can still open it."}
            </p>

            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              disabled={saving}
              maxLength={150}
              placeholder="Event Name"
              aria-label="Event name"
              className="w-full bg-transparent text-4xl font-semibold tracking-tight text-white outline-none placeholder:text-white/30"
            />

            {/* When */}
            <div className={`${card} grid gap-3 sm:grid-cols-[1fr_auto]`}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <span className="w-11 shrink-0 text-sm text-white/60">Start</span>
                  <input
                    type="date"
                    aria-label="Start date"
                    value={form.startDate}
                    disabled={saving}
                    onChange={(e) => set("startDate", e.target.value)}
                    className={`${field} min-w-0 flex-1`}
                  />
                  <input
                    type="time"
                    aria-label="Start time"
                    value={form.startTime}
                    disabled={saving}
                    onChange={(e) => set("startTime", e.target.value)}
                    className={`${field} w-32 shrink-0`}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-11 shrink-0 text-sm text-white/60">End</span>
                  <input
                    type="date"
                    aria-label="End date"
                    value={form.endDate}
                    disabled={saving}
                    onChange={(e) => set("endDate", e.target.value)}
                    className={`${field} min-w-0 flex-1`}
                  />
                  <input
                    type="time"
                    aria-label="End time"
                    value={form.endTime}
                    disabled={saving}
                    onChange={(e) => set("endTime", e.target.value)}
                    className={`${field} w-32 shrink-0`}
                  />
                </div>
                {hasEnd && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setForm((prev) => ({ ...prev, endDate: "", endTime: "" }))}
                    className="w-fit text-xs font-semibold text-white/50 hover:text-white"
                  >
                    Remove end time
                  </button>
                )}
              </div>
              <div className="flex flex-col justify-center rounded-xl bg-white/10 px-4 py-3">
                <span className="text-sm font-medium">GMT+05:30</span>
                <span className="text-xs text-white/55">Kolkata</span>
              </div>
            </div>

            {/* Where */}
            <div className={card}>
              <div className="mb-3 flex gap-2">
                {(["in-person", "online"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    disabled={saving}
                    onClick={() => set("locationType", type)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                      form.locationType === type
                        ? "bg-white/20 text-white"
                        : "text-white/50 hover:text-white"
                    }`}
                  >
                    {type === "in-person" ? "In person" : "Online"}
                  </button>
                ))}
              </div>

              {form.locationType === "in-person" ? (
                <LocationPicker
                  location={form.location}
                  lat={form.lat}
                  lng={form.lng}
                  disabled={saving}
                  onChange={(next) => setForm((prev) => ({ ...prev, ...next }))}
                />
              ) : (
                <div>
                  <input
                    value={form.meetingUrl}
                    onChange={(e) => set("meetingUrl", e.target.value)}
                    disabled={saving}
                    maxLength={500}
                    placeholder="Paste your meeting link (https://...)"
                    aria-label="Meeting link"
                    className="w-full rounded-lg bg-white/10 px-3 py-2.5 text-sm text-white outline-none ring-1 ring-transparent placeholder:text-white/40 focus:ring-white/30 disabled:opacity-50"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href="https://zoom.us/meeting/schedule"
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/15"
                    >
                      Create Zoom meeting &#8599;
                    </a>
                    <a
                      href="https://meet.google.com/new"
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/15"
                    >
                      Create Google Meet &#8599;
                    </a>
                  </div>
                  <p className="mt-2 text-xs text-white/45">
                    Create the meeting, then paste its link above. The link is not shown publicly.
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            <div className={card}>
              <label htmlFor="description" className={sectionLabel}>
                Description
              </label>
              <textarea
                id="description"
                rows={6}
                value={form.description}
                disabled={saving}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Tell people what this event is about"
                className="mt-2 w-full resize-y bg-transparent text-sm text-white outline-none placeholder:text-white/35"
              />
            </div>

            {/* Options */}
            <div>
              <p className={`${sectionLabel} mb-2`}>Event Options</p>
              <div className={`${card} divide-y divide-white/10 !p-0`}>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm">Ticket Price</span>
                  <span className="text-sm text-white/55">Free</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm">Require Approval</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.requireApproval}
                    aria-label="Require approval"
                    disabled={saving}
                    onClick={() => set("requireApproval", !form.requireApproval)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      form.requireApproval ? "bg-emerald-500" : "bg-white/20"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                        form.requireApproval ? "left-[22px]" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <label htmlFor="capacity" className="text-sm">
                    Capacity
                  </label>
                  <input
                    id="capacity"
                    inputMode="numeric"
                    value={form.capacity}
                    disabled={saving}
                    onChange={(e) => set("capacity", e.target.value)}
                    placeholder="Unlimited"
                    className="w-28 rounded-lg bg-white/10 px-3 py-1.5 text-right text-sm text-white outline-none ring-1 ring-transparent placeholder:text-white/40 focus:ring-white/30 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-red-300">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-neutral-950 hover:bg-white/90 disabled:opacity-60"
            >
              {saving ? status || "Saving..." : eventId ? "Save Changes" : "Create Event"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="text-sm font-medium text-white/55 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
        <GalleryField items={gallery} onChange={setGallery} disabled={saving} />
      </div>
    </form>
  );
}