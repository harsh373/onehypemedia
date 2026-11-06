import { useEffect, useRef, useState } from "react";

type CopyState = "idle" | "done" | "failed";

// Copies text (or opens the system share sheet when `share` is set and supported).
export default function CopyButton({
  text,
  label = "Copy",
  doneLabel = "Copied",
  share = false,
  shareTitle = "",
  className = "bg-white/10 hover:bg-white/15",
}: {
  text: string;
  label?: string;
  doneLabel?: string;
  share?: boolean;
  shareTitle?: string;
  className?: string;
}) {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => window.clearTimeout(timer.current);
  }, []);

  function flash(next: CopyState) {
    setState(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 1800);
  }

  async function handleClick() {
    if (share && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: shareTitle, url: text });
        return;
      } catch (err) {
        // User closed the share sheet: do nothing. Anything else: fall back to copy.
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      flash("done");
    } catch {
      flash("failed");
    }
  }

  const shown =
    state === "done" ? doneLabel : state === "failed" ? "Copy failed" : label;

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${className}`}
    >
      {shown}
    </button>
  );
}