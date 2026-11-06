const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// True when the event started before today began in India (midnight IST).
// Same rule as the backend, so the page and the server always agree.
export function isBeforeTodayIST(iso: string): boolean {
  const shifted = Date.now() + IST_OFFSET_MS;
  const startOfToday = Math.floor(shifted / DAY_MS) * DAY_MS - IST_OFFSET_MS;
  return new Date(iso).getTime() < startOfToday;
}