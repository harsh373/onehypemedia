const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// The exact moment today began in India (midnight IST), as a Date.
// Events before this moment count as past; events at or after it count as upcoming.
export function startOfTodayIST(): Date {
  const shifted = Date.now() + IST_OFFSET_MS;
  return new Date(Math.floor(shifted / DAY_MS) * DAY_MS - IST_OFFSET_MS);
}