import { useEffect, useState } from "react";
import {
  type AdminParticipationStatus,
  type AdminSettableStatus,
  type EventParticipant,
  checkInParticipation,
  formatEventDate,
  formatEventTime,
  listEventParticipants,
  removeParticipation,
  updateParticipationStatus,
} from "../api/events";

type Props = {
  eventId: string;
  capacity: number | null | undefined;
  onOpenUser: (id: string) => void;
};

type Result =
  | { eventId: string; rows: EventParticipant[] }
  | { eventId: string; error: string }
  | null;

type Filter = "all" | AdminParticipationStatus;

const EMPTY_ROWS: EventParticipant[] = [];

const STATUS_UI: Record<
  AdminParticipationStatus,
  { label: string; badge: string }
> = {
  registered: {
    label: "Going",
    badge: "bg-emerald-400/15 text-emerald-300",
  },
  pending: {
    label: "Pending",
    badge: "bg-amber-400/15 text-amber-300",
  },
  declined: {
    label: "Declined",
    badge: "bg-red-400/15 text-red-300",
  },
  cancelled: {
    label: "Cancelled",
    badge: "bg-white/10 text-white/50",
  },
};

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "registered", label: "Going" },
  { key: "pending", label: "Pending" },
  { key: "declined", label: "Declined" },
  { key: "cancelled", label: "Cancelled" },
];

const smallButton =
  "rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white/15 disabled:opacity-40";
const primarySmallButton =
  "rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-neutral-950 transition-colors hover:bg-white/90 disabled:opacity-40";
const dangerSmallButton =
  "rounded-lg px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-400/10 disabled:opacity-40";

export default function EventGuests({ eventId, capacity, onOpenUser }: Props) {
  const [result, setResult] = useState<Result>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let cancelled = false;
    listEventParticipants(eventId)
      .then((rows) => {
        if (!cancelled) setResult({ eventId, rows });
      })
      .catch((e: Error) => {
        if (!cancelled) setResult({ eventId, error: e.message });
      });
    return () => {
      cancelled = true;
    };
  }, [eventId, reloadKey]);

  function patchRow(id: string, patch: Partial<EventParticipant>) {
    setResult((prev) =>
      prev && "rows" in prev
        ? {
            ...prev,
            rows: prev.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)),
          }
        : prev
    );
  }

  async function run(id: string, action: () => Promise<void>) {
    if (busyId) return;
    setBusyId(id);
    setActionError("");
    try {
      await action();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setBusyId("");
    }
  }

  function handleCheckIn(p: EventParticipant) {
    return run(p.id, async () => {
      const res = await checkInParticipation(p.id, !p.checkedInAt);
      patchRow(p.id, { checkedInAt: res.checkedInAt });
    });
  }

  function handleSetStatus(p: EventParticipant, next: AdminSettableStatus) {
    return run(p.id, async () => {
      const res = await updateParticipationStatus(p.id, next);
      patchRow(p.id, { status: res.status, checkedInAt: res.checkedInAt });
    });
  }

  function handleRemove(p: EventParticipant) {
    if (
      !window.confirm(
        `Remove ${p.user.name} from this event? They will be able to register again.`
      )
    ) {
      return Promise.resolve();
    }
    return run(p.id, async () => {
      await removeParticipation(p.id);
      setResult((prev) =>
        prev && "rows" in prev
          ? { ...prev, rows: prev.rows.filter((r) => r.id !== p.id) }
          : prev
      );
    });
  }

  const loading = result === null || result.eventId !== eventId;

  if (loading) {
    return <p className="text-white/55">Loading guests...</p>;
  }

  if ("error" in result) {
    return (
      <div>
        <p className="text-sm text-red-400">{result.error}</p>
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          className={`${smallButton} mt-3`}
        >
          Retry
        </button>
      </div>
    );
  }

  const rows = result.rows ?? EMPTY_ROWS;
  const going = rows.filter((r) => r.status === "registered").length;
  const pendingCount = rows.filter((r) => r.status === "pending").length;
  const cancelledCount = rows.filter((r) => r.status === "cancelled").length;
  const checkedInCount = rows.filter(
    (r) => r.status === "registered" && r.checkedInAt
  ).length;

  // Pending requests hold a spot, same rule the backend uses.
  const taken = going + pendingCount;
  const hasCapacity = typeof capacity === "number" && capacity > 0;
  const fillPercent = hasCapacity
    ? Math.min(100, Math.round((taken / capacity) * 100))
    : 0;

  const query = search.trim().toLowerCase();
  const visible = rows.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (!query) return true;
    return (
      r.user.name.toLowerCase().includes(query) ||
      r.user.username.toLowerCase().includes(query) ||
      r.user.email.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* At a glance */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
        <h2 className="text-lg font-semibold">At a Glance</h2>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-3xl font-semibold">{going}</p>
            <p className="text-sm text-white/55">Going</p>
          </div>
          <div>
            <p className="text-3xl font-semibold">
              {checkedInCount}
              <span className="text-base font-normal text-white/45">
                {" "}
                of {going}
              </span>
            </p>
            <p className="text-sm text-white/55">Checked in</p>
          </div>
          <div>
            <p className="text-3xl font-semibold">{pendingCount}</p>
            <p className="text-sm text-white/55">Pending</p>
          </div>
          <div>
            <p className="text-3xl font-semibold">{cancelledCount}</p>
            <p className="text-sm text-white/55">Cancelled</p>
          </div>
        </div>

        {hasCapacity && (
          <div className="mt-5">
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-white"
                style={{ width: `${fillPercent}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-white/55">
              {taken} of {capacity} spots taken
              {pendingCount > 0 ? " (pending requests hold a spot)" : ""}
            </p>
          </div>
        )}
      </div>

      {/* Guest list */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Guest List</h2>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className={smallButton}
          >
            Refresh
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, username or email"
            className="min-w-0 flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm text-white outline-none ring-1 ring-transparent placeholder:text-white/40 focus:ring-white/30"
          />
          <div className="flex flex-wrap gap-1 rounded-lg bg-white/[0.06] p-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  filter === f.key
                    ? "bg-white/15 text-white"
                    : "text-white/55 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {actionError && (
          <p className="mt-3 text-sm text-red-400">{actionError}</p>
        )}

        {rows.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-white/15 px-6 py-12 text-center">
            <p className="text-lg font-semibold text-white/80">No Guests Yet</p>
            <p className="mt-1 text-sm text-white/50">
              Share the event link to get people to register.
            </p>
          </div>
        ) : visible.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-white/15 px-6 py-10 text-center">
            <p className="text-sm text-white/55">
              No guests match your search or filter.
            </p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
            {visible.map((p) => {
              const ui = STATUS_UI[p.status];
              const busy = busyId === p.id;
              const isGoing = p.status === "registered";
              return (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenUser(p.user.id)}
                        className="font-semibold hover:underline"
                      >
                        {p.user.name}
                      </button>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${ui.badge}`}
                      >
                        {ui.label}
                      </span>
                      {isGoing && p.checkedInAt && (
                        <span className="rounded-full bg-sky-400/15 px-2 py-0.5 text-xs font-medium text-sky-300">
                          Checked in
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-white/55">
                      @{p.user.username} &middot; {p.user.email}
                      {p.user.phone ? ` · ${p.user.phone}` : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-white/40">
                      Signed up {formatEventDate(p.registeredAt)}
                      {isGoing && p.checkedInAt
                        ? ` · Checked in at ${formatEventTime(p.checkedInAt)}`
                        : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(p.status === "pending" || p.status === "declined") && (
                      <button
                        type="button"
                        onClick={() => handleSetStatus(p, "registered")}
                        disabled={busyId !== ""}
                        className={primarySmallButton}
                      >
                        {busy ? "..." : "Approve"}
                      </button>
                    )}
                    {p.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => handleSetStatus(p, "declined")}
                        disabled={busyId !== ""}
                        className={smallButton}
                      >
                        Decline
                      </button>
                    )}
                    {isGoing && (
                      <button
                        type="button"
                        onClick={() => handleCheckIn(p)}
                        disabled={busyId !== ""}
                        className={p.checkedInAt ? smallButton : primarySmallButton}
                      >
                        {busy ? "..." : p.checkedInAt ? "Undo check-in" : "Check in"}
                      </button>
                    )}
                    {isGoing && (
                      <button
                        type="button"
                        onClick={() => handleSetStatus(p, "cancelled")}
                        disabled={busyId !== ""}
                        className={smallButton}
                      >
                        Cancel
                      </button>
                    )}
                    {p.status === "cancelled" && (
                      <button
                        type="button"
                        onClick={() => handleSetStatus(p, "registered")}
                        disabled={busyId !== ""}
                        className={smallButton}
                      >
                        Re-register
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemove(p)}
                      disabled={busyId !== ""}
                      className={dangerSmallButton}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}