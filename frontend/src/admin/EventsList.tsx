import { useEffect, useMemo, useState } from "react";
import {
  type EventRecord,
  deleteEvent,
  formatEventDate,
  listAdminEvents,
} from "../api/events";
import { imageUrl } from "../api/images";
import { isBeforeTodayIST } from "../api/istDay";

type Props = {
  onCreate: () => void;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onNotice: (message: string) => void;
};

type Tab = "upcoming" | "past";

export default function EventsList({ onCreate, onOpen, onEdit, onNotice }: Props) {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("upcoming");
  const [toDelete, setToDelete] = useState<EventRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    listAdminEvents()
      .then(setEvents)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const { upcoming, past } = useMemo(() => {
    const time = (e: EventRecord) => new Date(e.date).getTime();
    return {
      upcoming: events
        .filter((e) => !isBeforeTodayIST(e.date))
        .sort((a, b) => time(a) - time(b)),
      past: events
        .filter((e) => isBeforeTodayIST(e.date))
        .sort((a, b) => time(b) - time(a)),
    };
  }, [events]);

  const shown = tab === "upcoming" ? upcoming : past;

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteEvent(toDelete._id);
      setEvents((prev) => prev.filter((e) => e._id !== toDelete._id));
      onNotice("Event deleted.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete event.");
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  }

  const tabClass = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
      active ? "bg-white/15 text-white" : "text-white/55 hover:text-white"
    }`;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Events</h1>
        <div className="flex items-center gap-3">
          <div className="flex rounded-full bg-white/[0.06] p-1">
            <button onClick={() => setTab("upcoming")} className={tabClass(tab === "upcoming")}>
              Upcoming ({upcoming.length})
            </button>
            <button onClick={() => setTab("past")} className={tabClass(tab === "past")}>
              Past ({past.length})
            </button>
          </div>
          <button
            onClick={onCreate}
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-white/90"
          >
            + Create Event
          </button>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {loading ? (
        <p className="mt-10 text-white/55">Loading events...</p>
      ) : shown.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-white/15 px-6 py-14 text-center">
          <p className="text-lg font-semibold text-white/80">
            {tab === "upcoming" ? "No upcoming events" : "No past events"}
          </p>
          <p className="mt-1 text-sm text-white/50">
            {events.length === 0
              ? "Create your first event to get started."
              : "Switch the toggle above to see the others."}
          </p>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {shown.map((event) => {
            const count = event.registeredCount ?? 0;
            return (
              <li
                key={event._id}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition-colors hover:bg-white/[0.07]"
              >
                <button
                  onClick={() => onOpen(event._id)}
                  className="flex min-w-0 flex-1 items-center gap-4 text-left"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/10">
                    {event.coverImage && (
                      <img
                        src={imageUrl(event.coverImage, 200)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold">{event.title}</p>
                    <p className="truncate text-sm text-white/55">
                      {formatEventDate(event.date)} · {event.location}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-white/40">
                      {count} {count === 1 ? "guest" : "guests"}
                    </p>
                  </div>
                </button>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => onEdit(event._id)}
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/15"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setToDelete(event)}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/10"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1c1c1f] p-6">
            <p className="text-lg font-semibold">Delete this event?</p>
            <p className="mt-2 text-sm text-white/55">
              "{toDelete.title}" and all its images and registrations will be
              permanently deleted.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setToDelete(null)}
                disabled={deleting}
                className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-lg bg-[#e31d25] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}