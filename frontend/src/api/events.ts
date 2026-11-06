import { http, getErrorMessage } from "./http";
import type { Crop } from "./images";

export type LocationType = "in-person" | "online";
export type Visibility = "public" | "private";

export type EventImage = {
  _id: string;
  url: string;
  publicId: string;
  crop?: Crop;
  order: number;
};

export type CoverPayload = {
  url: string;
  publicId: string;
  crop: Crop;
};

export type EventRecord = {
  _id: string;
  title: string;
  slug: string;
  description: string;
  date: string;
  endDate?: string | null;
  timezone?: string;
  location: string;
  locationType?: LocationType;
  meetingUrl?: string;
  lat?: number | null;
  lng?: number | null;
  capacity?: number | null;
  requireApproval?: boolean;
  registrationOpen?: boolean;
  visibility?: Visibility;
  theme?: string;
  coverImage: EventImage | null;
  gallery: EventImage[];
  // Admin only
  registeredCount?: number;
  pendingCount?: number;
  // Public single-event payload only
  isFull?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EventInput = {
  title: string;
  description: string;
  date: string;
  endDate: string | null;
  timezone: string;
  location: string;
  locationType: LocationType;
  meetingUrl: string;
  lat: number | null;
  lng: number | null;
  capacity: number | null;
  requireApproval: boolean;
  visibility: Visibility;
  theme: string;
  coverImage: CoverPayload;
  gallery: CoverPayload[];
};

export type RegistrationInput = {
  registrationOpen: boolean;
  requireApproval: boolean;
  capacity: number | null;
};

// "registered" means CONFIRMED.
export type AdminParticipationStatus =
  | "registered"
  | "pending"
  | "declined"
  | "cancelled";

// Statuses an admin can set. "pending" only comes from a guest asking to join.
export type AdminSettableStatus = Exclude<AdminParticipationStatus, "pending">;

export type AdminUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  bio: string;
  location: string;
  createdAt: string;
  registeredCount: number;
};

export type AdminUserParticipation = {
  id: string;
  status: AdminParticipationStatus;
  registeredAt: string;
  event: { id: string; title: string; slug: string; date: string };
};

export type AdminUserDetail = AdminUser & {
  participations: AdminUserParticipation[];
};

export type EventParticipant = {
  id: string;
  status: AdminParticipationStatus;
  registeredAt: string;
  checkedInAt: string | null;
  user: {
    id: string;
    name: string;
    username: string;
    email: string;
    phone: string;
  };
};

async function call<T>(
  request: () => Promise<{ data: { data: T } }>
): Promise<T> {
  try {
    const res = await request();
    return res.data.data;
  } catch (err) {
    throw new Error(getErrorMessage(err), { cause: err });
  }
}

const EVENT_TIMEZONE = "Asia/Kolkata";

// Old events are stored at midnight UTC, which is 5:30 AM the same day in IST,
// so formatting in IST keeps old dates unchanged and gives timed events the right day.
export function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: EVENT_TIMEZONE,
  });
}

export function formatEventTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: EVENT_TIMEZONE,
  });
}

// "27 Oct 2026 · 12:30 AM – 1:30 AM IST". Old events without a time show only the date.
export function formatEventWhen(
  event: Pick<EventRecord, "date" | "endDate" | "timezone">
): string {
  if (!event.timezone) return formatEventDate(event.date);

  let text = `${formatEventDate(event.date)} · ${formatEventTime(event.date)}`;
  if (event.endDate) {
    const sameDay = formatEventDate(event.endDate) === formatEventDate(event.date);
    text += sameDay
      ? ` – ${formatEventTime(event.endDate)}`
      : ` – ${formatEventDate(event.endDate)}, ${formatEventTime(event.endDate)}`;
  }
  return `${text} IST`;
}

// Public
export const getEvents = () =>
  call(() => http.get<{ data: EventRecord[] }>("/events"));

export const getUpcomingEvents = () =>
  call(() =>
    http.get<{ data: EventRecord[] }>("/events", { params: { upcoming: "true" } })
  );

export const getPastEvents = () =>
  call(() =>
    http.get<{ data: EventRecord[] }>("/events", { params: { past: "true" } })
  );

export const getEventBySlug = (slug: string) =>
  call(() =>
    http.get<{ data: EventRecord }>(`/events/${encodeURIComponent(slug)}`)
  );

// Admin: events
export const listAdminEvents = () =>
  call(() => http.get<{ data: EventRecord[] }>("/admin/events"));

export const getAdminEvent = (id: string) =>
  call(() => http.get<{ data: EventRecord }>(`/admin/events/${id}`));

export const createEvent = (input: EventInput) =>
  call(() => http.post<{ data: EventRecord }>("/admin/events", input));

export const updateEvent = (id: string, input: EventInput) =>
  call(() => http.put<{ data: EventRecord }>(`/admin/events/${id}`, input));

export const updateEventRegistration = (id: string, input: RegistrationInput) =>
  call(() =>
    http.patch<{ data: EventRecord }>(`/admin/events/${id}/registration`, input)
  );

export async function deleteEvent(id: string): Promise<void> {
  try {
    await http.delete(`/admin/events/${id}`);
  } catch (err) {
    throw new Error(getErrorMessage(err), { cause: err });
  }
}

// Admin: users and participants
export const listAdminUsers = () =>
  call(() => http.get<{ data: AdminUser[] }>("/admin/users"));

export const getAdminUser = (id: string) =>
  call(() => http.get<{ data: AdminUserDetail }>(`/admin/users/${id}`));

export const listEventParticipants = (eventId: string) =>
  call(() =>
    http.get<{ data: EventParticipant[] }>(`/admin/events/${eventId}/participants`)
  );

export const updateParticipationStatus = (
  id: string,
  status: AdminSettableStatus
) =>
  call(() =>
    http.patch<{
      data: {
        id: string;
        status: AdminParticipationStatus;
        checkedInAt: string | null;
      };
    }>(`/admin/participations/${id}`, { status })
  );

export const checkInParticipation = (id: string, checkedIn: boolean) =>
  call(() =>
    http.patch<{ data: { id: string; checkedInAt: string | null } }>(
      `/admin/participations/${id}/check-in`,
      { checkedIn }
    )
  );

export async function removeParticipation(id: string): Promise<void> {
  try {
    await http.delete(`/admin/participations/${id}`);
  } catch (err) {
    throw new Error(getErrorMessage(err), { cause: err });
  }
}