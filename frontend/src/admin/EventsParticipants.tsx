import { useEffect, useState } from "react";
import { listEventParticipants, updateParticipationStatus, removeParticipation, formatEventDate } from "../api/events";
import type { EventParticipant } from "../api/events";

type Props = {
  eventId: string;
  onOpenUser: (id: string) => void;
};

type Result =
  | { eventId: string; rows: EventParticipant[] }
  | { eventId: string; error: string }
  | null;

const th = { padding: "10px 12px", textAlign: "left" as const, whiteSpace: "nowrap" as const };
const td = { padding: "12px", whiteSpace: "nowrap" as const };

export default function EventParticipants({ eventId, onOpenUser }: Props) {
  const [result, setResult] = useState<Result>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [showCancelled, setShowCancelled] = useState(false);
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

  async function handleToggle(p: EventParticipant) {
    if (busyId) return;
    const next = p.status === "registered" ? "cancelled" : "registered";
    setBusyId(p.id);
    setActionError("");
    try {
      await updateParticipationStatus(p.id, next);
      setResult((prev) => (prev && "rows" in prev ? { ...prev, rows: prev.rows.map((r) => (r.id === p.id ? { ...r, status: next } : r)) } : prev));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update.");
    } finally {
      setBusyId("");
    }
  }

  async function handleRemove(p: EventParticipant) {
    if (busyId) return;
    if (!window.confirm(`Remove ${p.user.name} from this event? They will be able to register again.`)) return;
    setBusyId(p.id);
    setActionError("");
    try {
      await removeParticipation(p.id);
      setResult((prev) => (prev && "rows" in prev ? { ...prev, rows: prev.rows.filter((r) => r.id !== p.id) } : prev));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to remove.");
    } finally {
      setBusyId("");
    }
  }

  const loading = result === null || result.eventId !== eventId;

  return (
    <section className="max-w-3xl border-t border-neutral-200" style={{ marginTop: 56, paddingTop: 32 }}>
      {loading ? (
        <>
          <h2 className="text-lg font-extrabold tracking-tight">PARTICIPANTS</h2>
          <p className="text-neutral-500" style={{ marginTop: 12 }}>Loading participants...</p>
        </>
      ) : "error" in result ? (
        <>
          <h2 className="text-lg font-extrabold tracking-tight">PARTICIPANTS</h2>
          <p className="text-sm text-[#e31d25]" style={{ marginTop: 12 }}>{result.error}</p>
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="text-xs font-semibold tracking-widest underline" style={{ marginTop: 12 }}>RETRY</button>
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between" style={{ gap: 12 }}>
            <h2 className="text-lg font-extrabold tracking-tight">PARTICIPANTS ({result.rows.filter((r) => r.status === "registered").length} registered)</h2>
            <div className="flex items-center" style={{ gap: 16 }}>
              <button type="button" onClick={() => setShowCancelled((v) => !v)} className="text-xs font-semibold tracking-widest underline">
                {showCancelled ? "HIDE CANCELLED" : `SHOW CANCELLED (${result.rows.filter((r) => r.status === "cancelled").length})`}
              </button>
              <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="text-xs font-semibold tracking-widest underline">REFRESH</button>
            </div>
          </div>

          {actionError && <p className="text-sm text-[#e31d25]" style={{ marginTop: 12 }}>{actionError}</p>}

          {(() => {
            const visible = showCancelled ? result.rows : result.rows.filter((r) => r.status === "registered");
            if (visible.length === 0) {
              return <p className="text-neutral-500" style={{ marginTop: 12 }}>{result.rows.length === 0 ? "Nobody has signed up for this event yet." : "No registered participants. Use SHOW CANCELLED to see people who cancelled."}</p>;
            }
            return (
              <div className="overflow-x-auto border border-neutral-200" style={{ marginTop: 16 }}>
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 text-xs font-semibold tracking-widest text-neutral-500">
                    <tr>
                      <th style={th}>NAME</th>
                      <th style={th}>USERNAME</th>
                      <th style={th}>EMAIL</th>
                      <th style={th}>STATUS</th>
                      <th style={th}>SIGNED UP</th>
                      <th style={th}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((p) => (
                      <tr key={p.id} className="border-t border-neutral-200">
                        <td style={td}><button type="button" onClick={() => onOpenUser(p.user.id)} className="font-semibold underline">{p.user.name}</button></td>
                        <td style={td}>@{p.user.username}</td>
                        <td style={td}>{p.user.email}</td>
                        <td style={td} className={p.status === "registered" ? "font-semibold" : "text-neutral-400"}>{p.status.toUpperCase()}</td>
                        <td style={td}>{formatEventDate(p.registeredAt)}</td>
                        <td style={td}>
                          <button type="button" onClick={() => handleToggle(p)} disabled={busyId !== ""} className="text-xs font-semibold tracking-widest underline disabled:opacity-40">{p.status === "registered" ? "MARK CANCELLED" : "MARK REGISTERED"}</button>
                          <button type="button" onClick={() => handleRemove(p)} disabled={busyId !== ""} className="text-xs font-semibold tracking-widest text-[#e31d25] underline disabled:opacity-40" style={{ marginLeft: 16 }}>REMOVE</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </>
      )}
    </section>
  );
}