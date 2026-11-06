import { useEffect, useState } from "react";
import { getEventInsights, type EventInsights } from "../api/insights";

type Props = {
  eventId: string;
};

type Range = 7 | 30;

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// "2026-10-27" -> "27 Oct"
function shortDay(day: string): string {
  const [, month, date] = day.split("-").map(Number);
  return `${date} ${MONTHS[month - 1]}`;
}

// The last n days ending at `today`, oldest first. Plain calendar math in UTC,
// so the browser's own timezone never matters.
function lastDays(today: string, n: number): string[] {
  const [y, m, d] = today.split("-").map(Number);
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    days.push(new Date(Date.UTC(y, m - 1, d - i)).toISOString().slice(0, 10));
  }
  return days;
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-sm text-white/55">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-white/45">{hint}</p>}
    </div>
  );
}

export default function EventInsights({ eventId }: Props) {
  const [data, setData] = useState<EventInsights | null>(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [range, setRange] = useState<Range>(7);

  useEffect(() => {
    let cancelled = false;
    getEventInsights(eventId)
      .then((insights) => {
        if (cancelled) return;
        setData(insights);
        setError("");
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId, reloadKey]);

  function retry() {
    setError("");
    setReloadKey((k) => k + 1);
  }

  if (error && data === null) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={retry}
          className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15"
        >
          Try again
        </button>
      </div>
    );
  }

  if (data === null) {
    return <p className="text-white/55">Loading insights...</p>;
  }

  const { statusBreakdown: s } = data;
  const countByDay = new Map(data.registrationsByDay.map((r) => [r.day, r.count]));
  const bars = lastDays(data.today, range).map((day) => ({
    day,
    count: countByDay.get(day) ?? 0,
  }));
  const max = Math.max(1, ...bars.map((b) => b.count));
  const rangeTotal = bars.reduce((sum, b) => sum + b.count, 0);

  const capacityValue =
    data.capacity === null
      ? "Unlimited"
      : `${data.taken} / ${data.capacity}`;
  const capacityHint =
    data.fillPercent === null ? `${data.taken} signed up` : `${data.fillPercent}% full`;

  return (
    <div className="space-y-8">
      {error && (
        <p className="text-sm text-red-400">
          Could not refresh: {error}{" "}
          <button onClick={retry} className="underline">
            Try again
          </button>
        </p>
      )}

      <section>
        <h2 className="text-lg font-semibold">Guests</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label="Going" value={String(s.registered)} />
          <StatCard label="Pending" value={String(s.pending)} />
          <StatCard label="Declined" value={String(s.declined)} />
          <StatCard label="Cancelled" value={String(s.cancelled)} />
          <StatCard
            label="Checked in"
            value={`${data.checkedIn} of ${s.registered}`}
            hint="Out of confirmed guests"
          />
          <StatCard
            label="Capacity used"
            value={capacityValue}
            hint={capacityHint}
          />
        </div>

        {data.fillPercent !== null && (
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-white"
              style={{ width: `${Math.min(100, data.fillPercent)}%` }}
            />
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Registrations</h2>
            <p className="mt-1 text-sm text-white/55">
              {rangeTotal} {rangeTotal === 1 ? "sign-up" : "sign-ups"} in the last{" "}
              {range} days (Going + Pending)
            </p>
          </div>
          <select
            value={range}
            onChange={(e) => setRange(Number(e.target.value) as Range)}
            className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white [color-scheme:dark] focus:outline-none"
          >
            <option value={7}>Past 7 days</option>
            <option value={30}>Past 30 days</option>
          </select>
        </div>

        <div className="mt-6 overflow-x-auto pb-2">
          <div
            className="flex h-44 items-end gap-2"
            style={{ minWidth: `${bars.length * 40}px` }}
          >
            {bars.map((bar) => (
              <div
                key={bar.day}
                className="flex h-full flex-1 flex-col items-center justify-end"
              >
                <span className="mb-1 text-xs text-white/70">{bar.count}</span>
                <div
                  className={`w-full rounded-t ${
                    bar.count > 0 ? "bg-white" : "bg-white/10"
                  }`}
                  style={{
                    height: bar.count > 0 ? `${(bar.count / max) * 100}%` : "2px",
                  }}
                  title={`${shortDay(bar.day)}: ${bar.count}`}
                />
              </div>
            ))}
          </div>
          <div
            className="mt-2 flex gap-2"
            style={{ minWidth: `${bars.length * 40}px` }}
          >
            {bars.map((bar) => (
              <span
                key={bar.day}
                className="flex-1 text-center text-[10px] text-white/45"
              >
                {shortDay(bar.day)}
              </span>
            ))}
          </div>
        </div>

        {rangeTotal === 0 && (
          <p className="mt-4 text-sm text-white/45">
            No sign-ups in this period yet.
          </p>
        )}
      </section>
    </div>
  );
}