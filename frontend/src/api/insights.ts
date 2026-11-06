import { http, getErrorMessage } from "./http";

export type EventInsights = {
  today: string; // "YYYY-MM-DD", the current day in IST
  statusBreakdown: {
    registered: number;
    pending: number;
    declined: number;
    cancelled: number;
  };
  checkedIn: number;
  capacity: number | null;
  taken: number;
  fillPercent: number | null;
  registrationsByDay: { day: string; count: number }[];
};

export async function getEventInsights(eventId: string): Promise<EventInsights> {
  try {
    const res = await http.get<{ data: EventInsights }>(
      `/admin/events/${eventId}/insights`
    );
    return res.data.data;
  } catch (err) {
    throw new Error(getErrorMessage(err), { cause: err });
  }
}