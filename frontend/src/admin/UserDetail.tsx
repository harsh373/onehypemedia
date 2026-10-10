import { useEffect, useState } from "react";
import { getAdminUser, formatEventDate } from "../api/events";
import type { AdminUserDetail } from "../api/events";

type Props = {
  userId: string;
  onBack: () => void;
  onOpenEvent: (id: string) => void;
};

type Result =
  | { userId: string; user: AdminUserDetail }
  | { userId: string; error: string }
  | null;

const th = { padding: "10px 12px", textAlign: "left" as const, whiteSpace: "nowrap" as const };
const td = { padding: "12px", whiteSpace: "nowrap" as const };
const labelClass = "text-xs font-semibold tracking-widest text-neutral-500";

export default function UserDetail({ userId, onBack, onOpenEvent }: Props) {
  const [result, setResult] = useState<Result>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminUser(userId)
      .then((user) => {
        if (!cancelled) setResult({ userId, user });
      })
      .catch((e: Error) => {
        if (!cancelled) setResult({ userId, error: e.message });
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const backButton = (
    <button onClick={onBack} className="text-sm font-semibold tracking-widest text-neutral-500 hover:text-neutral-950">&larr; BACK TO USERS</button>
  );

  if (result === null || result.userId !== userId) {
    return (
      <div>
        {backButton}
        <p className="text-neutral-500" style={{ marginTop: 24 }}>Loading user...</p>
      </div>
    );
  }

  if ("error" in result) {
    return (
      <div>
        {backButton}
        <p className="text-sm text-[#e31d25]" style={{ marginTop: 24 }}>{result.error}</p>
      </div>
    );
  }

  const user = result.user;

  return (
    <div>
      {backButton}

      <h1 className="text-2xl font-extrabold tracking-tight" style={{ marginTop: 24 }}>{user.name}</h1>
      <p className="text-neutral-500">@{user.username}</p>

      <div className="grid sm:grid-cols-2" style={{ marginTop: 24, gap: 20 }}>
        <div>
          <p className={labelClass}>EMAIL</p>
          <p>{user.email}</p>
        </div>
        <div>
          <p className={labelClass}>PHONE</p>
          <p>{user.phone || "-"}</p>
        </div>
        <div>
          <p className={labelClass}>LOCATION</p>
          <p>{user.location || "-"}</p>
        </div>
        <div>
          <p className={labelClass}>JOINED</p>
          <p>{formatEventDate(user.createdAt)}</p>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <p className={labelClass}>BIO</p>
        <p style={{ whiteSpace: "pre-wrap" }}>{user.bio || "-"}</p>
      </div>

      <h2 className="text-lg font-extrabold tracking-tight" style={{ marginTop: 40 }}>EVENTS ({user.registeredCount} registered)</h2>

      {user.participations.length === 0 ? (
        <p className="text-neutral-500" style={{ marginTop: 12 }}>This user has not signed up for any event.</p>
      ) : (
        <div className="overflow-x-auto border border-neutral-200" style={{ marginTop: 16 }}>
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-xs font-semibold tracking-widest text-neutral-500">
              <tr>
                <th style={th}>EVENT</th>
                <th style={th}>EVENT DATE</th>
                <th style={th}>STATUS</th>
                <th style={th}>SIGNED UP</th>
              </tr>
            </thead>
            <tbody>
              {user.participations.map((p) => (
                <tr key={p.id} className="border-t border-neutral-200">
                  <td style={td}>
                    <button onClick={() => onOpenEvent(p.event.id)} className="font-semibold underline">{p.event.title}</button>
                  </td>
                  <td style={td}>{formatEventDate(p.event.date)}</td>
                  <td style={td} className={p.status === "registered" ? "font-semibold" : "text-neutral-400"}>{p.status.toUpperCase()}</td>
                  <td style={td}>{formatEventDate(p.registeredAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}