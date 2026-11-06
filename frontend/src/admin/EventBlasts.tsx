import { useEffect, useState } from "react";
import { formatEventDate, formatEventTime } from "../api/events";
import {
  listBlasts,
  sendBlast,
  sendTestBlast,
  type BlastAudience,
  type BlastOverview,
  type BlastRecord,
} from "../api/blasts";

const SUBJECT_MAX = 150;
const BODY_MAX = 5000;

const AUDIENCE_LABEL: Record<BlastAudience, string> = {
  registered: "Going (confirmed)",
  pending: "Pending approval",
  "all-active": "Going + Pending",
};

const STATUS_STYLE: Record<BlastRecord["status"], string> = {
  sent: "bg-emerald-400/15 text-emerald-300",
  partial: "bg-amber-400/15 text-amber-300",
  failed: "bg-red-500/15 text-red-300",
  sending: "bg-white/10 text-white/70",
};

const STATUS_LABEL: Record<BlastRecord["status"], string> = {
  sent: "Sent",
  partial: "Partly sent",
  failed: "Failed",
  sending: "Sending",
};

type Notice = { type: "ok" | "error"; text: string } | null;

type Props = {
  eventId: string;
};

export default function EventBlasts({ eventId }: Props) {
  const [data, setData] = useState<BlastOverview | null>(null);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [audience, setAudience] = useState<BlastAudience>("registered");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState<"send" | "test" | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    let cancelled = false;
    listBlasts(eventId)
      .then((overview) => {
        if (cancelled) return;
        setData(overview);
        setLoadError("");
      })
      .catch((e: Error) => {
        if (!cancelled) setLoadError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId, reloadKey]);

  function retry() {
    setLoadError("");
    setReloadKey((k) => k + 1);
  }

  if (loadError && data === null) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <p className="text-sm text-red-400">{loadError}</p>
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
    return <p className="text-white/55">Loading blasts...</p>;
  }

  const count = data.counts[audience];
  const filled = subject.trim().length > 0 && body.trim().length > 0;

  let blockReason = "";
  if (!data.mailConfigured) {
    blockReason = "Email is not configured on the server.";
  } else if (count === 0) {
    blockReason = "There are no guests in this audience yet.";
  } else if (count > data.limit) {
    blockReason = `A blast can reach at most ${data.limit} guests. This audience has ${count}.`;
  }

  const canSend = filled && blockReason === "" && busy === null;
  const canTest = filled && data.mailConfigured && busy === null;

  async function handleSend() {
    if (!canSend) return;
    if (!window.confirm(`Send to ${count} ${count === 1 ? "guest" : "guests"}?`)) {
      return;
    }
    setBusy("send");
    setNotice(null);
    try {
      const result = await sendBlast(eventId, { subject, body, audience });
      const blast = result.blast;
      if (blast && blast.status === "failed") {
        setNotice({
          type: "error",
          text: "No emails could be sent. Check the SMTP settings on the server.",
        });
      } else if (blast && blast.status === "partial") {
        setNotice({
          type: "error",
          text: `Sent to ${blast.sentCount}, failed for ${blast.failedCount}.`,
        });
      } else {
        setNotice({
          type: "ok",
          text: `Sent to ${blast?.sentCount ?? count} guests.`,
        });
        setSubject("");
        setBody("");
      }
      setReloadKey((k) => k + 1);
    } catch (e) {
      setNotice({
        type: "error",
        text: e instanceof Error ? e.message : "Something went wrong.",
      });
      setReloadKey((k) => k + 1);
    } finally {
      setBusy(null);
    }
  }

  async function handleTest() {
    if (!canTest) return;
    setBusy("test");
    setNotice(null);
    try {
      const result = await sendTestBlast(eventId, { subject, body, audience });
      setNotice({
        type: "ok",
        text: `Test sent to ${result.testSentTo ?? "you"}. Check your inbox and spam folder.`,
      });
    } catch (e) {
      setNotice({
        type: "error",
        text: e instanceof Error ? e.message : "Something went wrong.",
      });
    } finally {
      setBusy(null);
    }
  }

  const inputClass =
    "w-full rounded-lg bg-white/10 px-3 py-2.5 text-sm text-white ring-1 ring-transparent placeholder:text-white/35 focus:outline-none focus:ring-white/30";

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <h2 className="text-lg font-semibold">Send a blast to your guests</h2>
        <p className="mt-1 text-sm text-white/55">
          Guests receive this by email. Their addresses stay hidden from each other.
        </p>

        {!data.mailConfigured && (
          <div className="mt-4 rounded-lg bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
            Email is not configured on the server. Add the SMTP settings to the
            backend environment to enable blasts.
          </div>
        )}

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-white/70">To</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as BlastAudience)}
              className={`${inputClass} [color-scheme:dark]`}
            >
              {(Object.keys(AUDIENCE_LABEL) as BlastAudience[]).map((key) => (
                <option key={key} value={key}>
                  {AUDIENCE_LABEL[key]} ({data.counts[key]})
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-white/45">
              {count} {count === 1 ? "recipient" : "recipients"}
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-white/70">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={SUBJECT_MAX}
              placeholder="A quick update about the event"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-white/70">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={BODY_MAX}
              rows={7}
              placeholder="Write your message..."
              className={`${inputClass} resize-y`}
            />
            <p className="mt-1.5 text-right text-xs text-white/45">
              {body.length} / {BODY_MAX}
            </p>
          </div>
        </div>

        {blockReason && (
          <p className="mt-4 text-sm text-amber-200">{blockReason}</p>
        )}

        {notice && (
          <p
            className={`mt-4 text-sm ${
              notice.type === "ok" ? "text-emerald-300" : "text-red-400"
            }`}
          >
            {notice.text}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-neutral-950 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy === "send" ? "Sending..." : "Send"}
          </button>
          <button
            onClick={handleTest}
            disabled={!canTest}
            className="rounded-lg bg-white/10 px-5 py-2.5 text-sm font-medium hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy === "test" ? "Sending test..." : "Send test to me"}
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">History</h2>

        {loadError && (
          <p className="mt-3 text-sm text-red-400">
            Could not refresh: {loadError}{" "}
            <button onClick={retry} className="underline">
              Try again
            </button>
          </p>
        )}

        {data.blasts.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-white/15 px-6 py-12 text-center">
            <p className="text-lg font-semibold text-white/80">No blasts yet</p>
            <p className="mt-1 text-sm text-white/50">
              Messages you send to guests will appear here.
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {data.blasts.map((blast) => (
              <li
                key={blast._id}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{blast.subject}</p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[blast.status]}`}
                  >
                    {STATUS_LABEL[blast.status]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-white/55">
                  {formatEventDate(blast.createdAt)} ·{" "}
                  {formatEventTime(blast.createdAt)} ·{" "}
                  {AUDIENCE_LABEL[blast.audience]}
                </p>
                <p className="mt-1 text-sm text-white/45">
                  Sent {blast.sentCount}, failed {blast.failedCount} of{" "}
                  {blast.recipientCount}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}