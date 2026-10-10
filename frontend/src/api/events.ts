import { http, getErrorMessage } from "./http";
import type { Crop } from "./images";

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
  location: string;
  coverImage: EventImage | null;
  gallery: EventImage[];
  createdAt: string;
  updatedAt: string;
};

export type EventInput = {
  title: string;
  description: string;
  date: string;
  location: string;
  coverImage: CoverPayload;
  gallery: CoverPayload[];
};

export type AdminParticipationStatus = "registered" | "cancelled";

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

export function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
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
  status: AdminParticipationStatus
) =>
  call(() =>
    http.patch<{ data: { id: string; status: AdminParticipationStatus } }>(
      `/admin/participations/${id}`,
      { status }
    )
  );

export async function removeParticipation(id: string): Promise<void> {
  try {
    await http.delete(`/admin/participations/${id}`);
  } catch (err) {
    throw new Error(getErrorMessage(err), { cause: err });
  }
}