import { useState } from "react";
import {
  type EventRecord,
  deleteEvent,
  formatEventDate,
  formatEventTime,
  listEventParticipants,
} from "../api/events";
import CopyButton from "./CopyButton";
import { getTheme } from "./eventTheme";
import { downloadGuestsCsv } from "./guestsCsv";

type Props = {
  event: EventRecord;
  onDeleted: () => void;
};

function stamp(iso: string): string {
  return `${formatEventDate(iso)} · ${formatEventTime(iso)} IST`;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
      <span className="text-sm text-white/55">{label}</span>
      <div className="flex min-w-0 items-center gap-2">{children}</div>
    </div>
  );
}

export default function EventMore({ event, onDeleted }: Props) {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const publicLink = `${window.location.origin}/hype-lab/${event.slug}`;
  const theme = getTheme(event.theme);

  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    setExportError("");
    try {
      const rows = await listEventParticipants(event._id);
      if (rows.length === 0) {
        setExportError("There are no guests to export yet.");
        return;
      }
      downloadGuestsCsv(event.slug, rows);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteEvent(event._id);
      onDeleted();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Failed to delete event.");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Details */}
      <section>
        <h2 className="text-lg font-semibold">Event Details</h2>
        <div className="mt-4 divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.04]">
          <Row label="Public link">
            <span className="min-w-0 truncate text-sm text-white/80">
              {publicLink}
            </span>
            <CopyButton text={publicLink} />
          </Row>
          <Row label="Event ID">
            <span className="min-w-0 truncate font-mono text-sm text-white/80">
              {event._id}
            </span>
            <CopyButton text={event._id} />
          </Row>
          <Row label="Created">
            <span className="text-sm text-white/80">{stamp(event.createdAt)}</span>
          </Row>
          <Row label="Last updated">
            <span className="text-sm text-white/80">{stamp(event.updatedAt)}</span>
          </Row>
          <Row label="Visibility">
            <span className="text-sm text-white/80">
              {event.visibility === "private" ? "Private" : "Public"}
            </span>
          </Row>
          <Row label="Theme">
            <span className="text-sm text-white/80">{theme.label}</span>
          </Row>
        </div>
      </section>

      {/* Export */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <h2 className="text-lg font-semibold">Export guests</h2>
        <p className="mt-1 text-sm text-white/55">
          Download every guest (all statuses) as a CSV file that opens in Excel
          or Google Sheets.
        </p>
        {exportError && (
          <p className="mt-3 text-sm text-red-400">{exportError}</p>
        )}
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-white/90 disabled:opacity-50"
        >
          {exporting ? "Preparing..." : "Download CSV"}
        </button>
      </section>

      {/* Danger zone */}
      <section className="rounded-2xl border border-red-500/30 bg-red-500/[0.05] p-5">
        <h2 className="text-lg font-semibold text-red-300">Danger zone</h2>
        <p className="mt-1 text-sm text-white/55">
          Deleting this event permanently removes its guests, blasts and photos.
          This cannot be undone.
        </p>
        <button
          type="button"
          onClick={() => {
            setDeleteError("");
            setShowDelete(true);
          }}
          className="mt-4 rounded-lg bg-[#e31d25] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Delete event
        </button>
      </section>

      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1c1c1f] p-6">
            <p className="text-lg font-semibold">Delete this event?</p>
            <p className="mt-2 text-sm text-white/55">
              &quot;{event.title}&quot; will be permanently deleted, together
              with all its guests, sent blasts and photos.
            </p>
            {deleteError && (
              <p className="mt-3 text-sm text-red-400">{deleteError}</p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDelete(false)}
                disabled={deleting}
                className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
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