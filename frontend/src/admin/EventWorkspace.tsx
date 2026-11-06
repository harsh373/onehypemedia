import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { type EventRecord, getAdminEvent } from "../api/events";
import EventBlasts from "./EventBlasts";
import EventGuests from "./EventGuests";
import EventInsights from "./EventInsights";
import EventMore from "./EventMore";
import EventOverview from "./EventOverview";
import EventRegistration from "./EventRegistration";

type Props = {
  onOpenUser: (id: string) => void;
  onNotice: (message: string) => void;
};

type Result =
  | { id: string; event: EventRecord }
  | { id: string; error: string }
  | null;

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "guests", label: "Guests" },
  { key: "registration", label: "Registration" },
  { key: "blasts", label: "Blasts" },
  { key: "insights", label: "Insights" },
  { key: "more", label: "More" },
] as const;

export default function EventWorkspace({ onOpenUser, onNotice }: Props) {
  const params = useParams();
  const navigate = useNavigate();
  const id = params.id ?? "";
  const activeKey = TABS.find((t) => t.key === params["*"])?.key ?? "overview";
  const base = `/adminn/events/${id}`;

  const [result, setResult] = useState<Result>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminEvent(id)
      .then((event) => {
        if (!cancelled) setResult({ id, event });
      })
      .catch((e: Error) => {
        if (!cancelled) setResult({ id, error: e.message });
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const backButton = (
    <button
      onClick={() => navigate("/adminn")}
      className="text-sm text-white/55 hover:text-white"
    >
      &larr; All events
    </button>
  );

  if (result === null || result.id !== id) {
    return (
      <div className="mx-auto max-w-3xl">
        {backButton}
        <p className="mt-6 text-white/55">Loading event...</p>
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

  const event = result.event;
  const activeLabel = TABS.find((t) => t.key === activeKey)?.label ?? "";
  const hasContent =
    activeKey === "overview" ||
    activeKey === "guests" ||
    activeKey === "registration" ||
    activeKey === "blasts" ||
    activeKey === "insights" ||
    activeKey === "more";

  return (
    <div className="mx-auto max-w-3xl">
      {backButton}

      <div className="mt-3 flex items-start justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">{event.title}</h1>
        <a
          href={`/hype-lab/${event.slug}`}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15"
        >
          Event Page &#8599;
        </a>
      </div>

      <nav className="mt-6 flex gap-6 overflow-x-auto border-b border-white/10">
        {TABS.map((t) => (
          <Link
            key={t.key}
            to={t.key === "overview" ? base : `${base}/${t.key}`}
            className={`-mb-px whitespace-nowrap border-b-2 pb-3 text-base font-medium transition-colors ${
              t.key === activeKey
                ? "border-white text-white"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="mt-8">
        {activeKey === "overview" && (
          <EventOverview event={event} base={base} />
        )}

        {activeKey === "guests" && (
          <EventGuests
            key={id}
            eventId={id}
            capacity={event.capacity}
            onOpenUser={onOpenUser}
          />
        )}

        {activeKey === "registration" && (
          <EventRegistration
            key={id}
            event={event}
            base={base}
            onSaved={(updated) => setResult({ id, event: updated })}
          />
        )}

        {activeKey === "blasts" && <EventBlasts key={id} eventId={id} />}

        {activeKey === "insights" && <EventInsights key={id} eventId={id} />}

        {activeKey === "more" && (
          <EventMore
            key={id}
            event={event}
            onDeleted={() => {
              onNotice("Event deleted.");
              navigate("/adminn");
            }}
          />
        )}

        {!hasContent && (
          <div className="rounded-2xl border border-dashed border-white/15 px-6 py-14 text-center">
            <p className="text-lg font-semibold text-white/80">{activeLabel}</p>
            <p className="mt-1 text-sm text-white/50">Not available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}