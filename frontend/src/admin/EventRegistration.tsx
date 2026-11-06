import { useState } from "react";
import { Link } from "react-router-dom";
import { type EventRecord, updateEventRegistration } from "../api/events";

type Props = {
  event: EventRecord;
  base: string;
  onSaved: (event: EventRecord) => void;
};

type ParsedCapacity = { value: number | null } | { error: string };

function parseCapacity(text: string): ParsedCapacity {
  const trimmed = text.trim();
  if (trimmed === "") return { value: null };
  if (!/^\d+$/.test(trimmed)) return { error: "Use a whole number, or leave empty for unlimited." };
  const n = Number(trimmed);
  if (n < 1 || n > 100000) return { error: "Capacity must be between 1 and 100000." };
  return { value: n };
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-white" : "bg-white/20"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full transition-all ${
          checked ? "left-[22px] bg-neutral-950" : "left-0.5 bg-white"
        }`}
      />
    </button>
  );
}

export default function EventRegistration({ event, base, onSaved }: Props) {
  const savedOpen = event.registrationOpen !== false;
  const savedApproval = Boolean(event.requireApproval);
  const savedCapacity =
    typeof event.capacity === "number" ? String(event.capacity) : "";

  const [open, setOpen] = useState(savedOpen);
  const [approval, setApproval] = useState(savedApproval);
  const [capacityText, setCapacityText] = useState(savedCapacity);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const parsed = parseCapacity(capacityText);
  const capacityError = "error" in parsed ? parsed.error : "";

  const dirty =
    open !== savedOpen ||
    approval !== savedApproval ||
    capacityText.trim() !== savedCapacity;

  const going = event.registeredCount ?? 0;
  const pending = event.pendingCount ?? 0;
  const taken = going + pending;
  const overbooked =
    "value" in parsed && typeof parsed.value === "number" && taken > parsed.value;

  async function handleSave() {
    if (saving || "error" in parsed) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = await updateEventRegistration(event._id, {
        registrationOpen: open,
        requireApproval: approval,
        capacity: parsed.value,
      });
      onSaved(updated);
      setMessage("Saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  const tile = "rounded-2xl border border-white/10 bg-white/[0.04] p-5";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className={tile}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-white/55">Registration</p>
              <p className="mt-1 text-xl font-semibold">
                {open ? "Open" : "Closed"}
              </p>
            </div>
            <Switch checked={open} onChange={setOpen} label="Registration open" />
          </div>
          <p className="mt-3 text-xs text-white/45">
            {open
              ? "People can register on the event page."
              : "New sign-ups are blocked. Existing guests are not affected."}
          </p>
        </div>

        <div className={tile}>
          <p className="text-sm text-white/55">Event Capacity</p>
          <input
            type="text"
            inputMode="numeric"
            value={capacityText}
            onChange={(e) => setCapacityText(e.target.value)}
            placeholder="Unlimited"
            aria-label="Event capacity"
            className="mt-1 w-full rounded-lg bg-white/10 px-3 py-2 text-lg font-semibold text-white outline-none ring-1 ring-transparent placeholder:font-normal placeholder:text-white/40 focus:ring-white/30"
          />
          <p className="mt-3 text-xs text-white/45">
            Leave empty for unlimited. Pending requests hold a spot.
          </p>
        </div>

        <div className={tile}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-white/55">Require Approval</p>
              <p className="mt-1 text-xl font-semibold">{approval ? "On" : "Off"}</p>
            </div>
            <Switch checked={approval} onChange={setApproval} label="Require approval" />
          </div>
          <p className="mt-3 text-xs text-white/45">
            {approval
              ? "New sign-ups wait for you to approve them."
              : "New sign-ups are confirmed instantly."}
          </p>
        </div>
      </div>

      {capacityError && <p className="text-sm text-red-400">{capacityError}</p>}

      {overbooked && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3">
          <p className="text-sm font-semibold text-amber-200">
            {taken} guests already hold spots
          </p>
          <p className="mt-0.5 text-xs text-amber-200/80">
            Nobody is removed if you set the capacity lower. It only blocks new
            sign-ups until spots free up.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <p className="text-sm text-white/55">Guests right now</p>
        <p className="mt-1 text-xl font-semibold">
          {going} going
          {pending > 0 && (
            <span className="text-base font-normal text-white/55">
              {" "}
              &middot; {pending} pending
            </span>
          )}
        </p>
        <Link
          to={`${base}/guests`}
          className="mt-2 inline-block text-sm text-white/60 underline-offset-2 hover:text-white hover:underline"
        >
          Manage guests
        </Link>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <p className="text-sm text-white/55">Tickets</p>
        <p className="mt-1 font-semibold">Standard &middot; Free</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !dirty || capacityError !== ""}
          className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-neutral-950 transition-colors hover:bg-white/90 disabled:opacity-40"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
        {!dirty && message && (
          <span className="text-sm text-emerald-300">{message}</span>
        )}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>

      <p className="text-xs text-white/40">
        Changes apply to new sign-ups. Guests who already registered keep their
        current status.
      </p>
    </div>
  );
}