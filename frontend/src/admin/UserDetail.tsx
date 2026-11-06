import { useEffect, useState } from "react";
import { getAdminUser, formatEventDate } from "../api/events";
import type { AdminParticipationStatus, AdminUserDetail } from "../api/events";

type Props = {
  userId: string;
  onBack: () => void;
  onOpenEvent: (id: string) => void;
};

type Result =
  | { userId: string; user: AdminUserDetail }
  | { userId: string; error: string }
  | null;

const STATUS_UI: Record<
  AdminParticipationStatus,
  { label: string; badge: string }
> = {
  registered: { label: "Going", badge: "bg-emerald-400/15 text-emerald-300" },
  pending: { label: "Pending", badge: "bg-amber-400/15 text-amber-300" },
  declined: { label: "Declined", badge: "bg-red-400/15 text-red-300" },
  cancelled: { label: "Cancelled", badge: "bg-white/10 text-white/50" },
};

const th = "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/45 whitespace-nowrap";
const td = "px-4 py-3 whitespace-nowrap";
const labelClass = "text-xs font-medium uppercase tracking-wider text-white/45";

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
    <button
      type="button"
      onClick={onBack}
      className="text-sm text-white/55 hover:text-white"
    >
      &larr; All users
    </button>
  );

  if (result === null || result.userId !== userId) {
    return (
      <div className="mx-auto max-w-3xl">
        {backButton}
        <p className="mt-6 text-white/55">Loading user...</p>
      </div>
    );
  }

  if ("error" in result) {
    return (
      <div className="mx-auto max-w-3xl">
        {backButton}
        <p className="mt-6 text-sm text-red-400">{result.error}</p>
      </div>
    );
  }

  const user = result.user;

  return (
    <div className="mx-auto max-w-3xl">
      {backButton}

      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{user.name}</h1>
      <p className="text-white/55">@{user.username}</p>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className={labelClass}>Email</p>
            <p className="mt-1 break-all">{user.email}</p>
          </div>
          <div>
            <p className={labelClass}>Phone</p>
            <p className="mt-1">{user.phone || "-"}</p>
          </div>
          <div>
            <p className={labelClass}>Location</p>
            <p className="mt-1">{user.location || "-"}</p>
          </div>
          <div>
            <p className={labelClass}>Joined</p>
            <p className="mt-1">{formatEventDate(user.createdAt)}</p>
          </div>
        </div>

        <div className="mt-5">
          <p className={labelClass}>Bio</p>
          <p className="mt-1 whitespace-pre-wrap text-white/80">
            {user.bio || "-"}
          </p>
        </div>
      </div>

      <h2 className="mt-10 text-lg font-semibold">
        Events{" "}
        <span className="font-normal text-white/45">
          {user.registeredCount} going
        </span>
      </h2>

      {user.participations.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-white/15 px-6 py-10 text-center">
          <p className="text-sm text-white/55">
            This user has not signed up for any event.
          </p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.04]">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10">
              <tr>
                <th className={th}>Event</th>
                <th className={th}>Event date</th>
                <th className={th}>Status</th>
                <th className={th}>Signed up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {user.participations.map((p) => {
                const ui = STATUS_UI[p.status];
                return (
                  <tr key={p.id} className="transition-colors hover:bg-white/[0.04]">
                    <td className={td}>
                      <button
                        type="button"
                        onClick={() => onOpenEvent(p.event.id)}
                        className="font-semibold hover:underline"
                      >
                        {p.event.title}
                      </button>
                    </td>
                    <td className={`${td} text-white/70`}>
                      {formatEventDate(p.event.date)}
                    </td>
                    <td className={td}>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${ui.badge}`}
                      >
                        {ui.label}
                      </span>
                    </td>
                    <td className={`${td} text-white/70`}>
                      {formatEventDate(p.registeredAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}