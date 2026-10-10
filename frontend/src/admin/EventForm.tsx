import { useEffect, useState } from "react";
import { createEvent, getAdminEvent, updateEvent } from "../api/events";
import type { CoverPayload, EventInput } from "../api/events";
import { imageUrl } from "../api/images";
import type { CoverState, GalleryItem } from "../api/images";
import { uploadImage } from "../api/uploads";
import CoverImageField from "./CoverImageField";
import GalleryField from "./GalleryField";

type Props = {
  eventId: string | null;
  onDone: (message: string) => void;
  onCancel: () => void;
};

type TextFields = Omit<EventInput, "coverImage" | "gallery">;
type Uploaded = { url: string; publicId: string };

const COVER_KEY = "__cover__";
const UPLOAD_CONCURRENCY = 3;

const EMPTY: TextFields = { title: "", description: "", date: "", location: "" };

const inputClass =
  "mt-2 w-full border border-neutral-300 px-4 py-3 text-neutral-950 outline-none focus:border-neutral-950";
const labelClass = "block text-xs font-semibold tracking-widest text-neutral-500";

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
  const [form, setForm] = useState<TextFields>(EMPTY);
  const [cover, setCover] = useState<CoverState>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(eventId !== null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!eventId) return;
    getAdminEvent(eventId)
      .then((ev) => {
        setForm({
          title: ev.title,
          description: ev.description,
          date: ev.date.slice(0, 10),
          location: ev.location,
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

  function set<K extends keyof TextFields>(key: K, value: TextFields[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    if (!form.title.trim()) return setError("Title is required.");
    if (!form.description.trim()) return setError("Description is required.");
    if (!form.date) return setError("Date is required.");
    if (!form.location.trim()) return setError("Location is required.");
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
      const payload: EventInput = {
        ...form,
        coverImage: coverPayload,
        gallery: galleryPayload,
      };

      if (eventId) {
        await updateEvent(eventId, payload);
        onDone("Event updated successfully.");
      } else {
        await createEvent(payload);
        onDone("Event created successfully.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event.");
      setSaving(false);
      setStatus("");
    }
  }

  if (loading) {
    return <p className="text-neutral-500">Loading event...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl">
      <h1 className="text-2xl font-extrabold tracking-tight">
        {eventId ? "EDIT EVENT" : "CREATE EVENT"}
      </h1>

      <label htmlFor="title" className={`mt-8 ${labelClass}`}>
        EVENT TITLE
      </label>
      <input
        id="title"
        value={form.title}
        onChange={(e) => set("title", e.target.value)}
        className={inputClass}
      />

      <label htmlFor="description" className={`mt-6 ${labelClass}`}>
        DESCRIPTION
      </label>
      <textarea
        id="description"
        rows={10}
        value={form.description}
        onChange={(e) => set("description", e.target.value)}
        className={inputClass}
      />

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="date" className={labelClass}>
            DATE
          </label>
          <input
            id="date"
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="location" className={labelClass}>
            LOCATION
          </label>
          <input
            id="location"
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-8">
        <CoverImageField value={cover} onChange={setCover} disabled={saving} />
      </div>

      <div className="mt-10">
        <GalleryField items={gallery} onChange={setGallery} disabled={saving} />
      </div>

      {error && <p className="mt-6 text-sm text-[#e31d25]">{error}</p>}

      <div className="mt-8 flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-neutral-950 px-6 py-3 text-sm font-semibold tracking-widest text-white disabled:opacity-50"
        >
          {saving
            ? status || "SAVING..."
            : eventId
              ? "SAVE CHANGES"
              : "SAVE EVENT"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="border border-neutral-300 px-6 py-3 text-sm font-semibold tracking-widest disabled:opacity-50"
        >
          CANCEL
        </button>
      </div>
    </form>
  );
}