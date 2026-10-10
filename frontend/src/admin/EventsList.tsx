import { useEffect, useState } from "react";
import {
 type EventRecord,
  deleteEvent,
  formatEventDate,
  listAdminEvents,
} from "../api/events";

type Props = {
  onCreate: () => void;
  onEdit: (id: string) => void;
  onNotice: (message: string) => void;
};

export default function EventsList({ onCreate, onEdit, onNotice }: Props) {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toDelete, setToDelete] = useState<EventRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    listAdminEvents()
      .then(setEvents)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">EVENTS</h1>
        <button
          onClick={onCreate}
          className="bg-neutral-950 px-4 py-2 text-sm font-semibold tracking-widest text-white"
        >
          + CREATE EVENT
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-[#e31d25]">{error}</p>}

      {loading ? (
        <p className="mt-8 text-neutral-500">Loading events...</p>
      ) : events.length === 0 ? (
        <p className="mt-8 text-neutral-500">
          No events yet. Create your first one.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-neutral-200 border-y border-neutral-200">
          {events.map((event) => (
            <li
              key={event._id}
              className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-lg font-bold">{event.title}</p>
                <p className="text-sm text-neutral-500">
                  {formatEventDate(event.date)} · {event.location}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => onEdit(event._id)}
                  className="border border-neutral-950 px-4 py-2 text-xs font-semibold tracking-widest"
                >
                  EDIT
                </button>
                <button
                  onClick={() => setToDelete(event)}
                  className="border border-[#e31d25] px-4 py-2 text-xs font-semibold tracking-widest text-[#e31d25]"
                >
                  DELETE
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md bg-white p-6">
            <p className="text-lg font-bold">
              Are you sure you want to delete this event?
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              This will also delete all associated images.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setToDelete(null)}
                disabled={deleting}
                className="border border-neutral-300 px-4 py-2 text-xs font-semibold tracking-widest disabled:opacity-50"
              >
                CANCEL
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="bg-[#e31d25] px-4 py-2 text-xs font-semibold tracking-widest text-white disabled:opacity-50"
              >
                {deleting ? "DELETING EVENT..." : "DELETE EVENT"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}