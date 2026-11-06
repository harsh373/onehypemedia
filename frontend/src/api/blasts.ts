import { http, getErrorMessage } from "./http";

export type BlastAudience = "registered" | "pending" | "all-active";
export type BlastStatus = "sending" | "sent" | "partial" | "failed";

export type BlastRecord = {
  _id: string;
  subject: string;
  audience: BlastAudience;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  status: BlastStatus;
  createdAt: string;
};

export type BlastOverview = {
  blasts: BlastRecord[];
  counts: Record<BlastAudience, number>;
  limit: number;
  mailConfigured: boolean;
};

export type BlastInput = {
  subject: string;
  body: string;
  audience: BlastAudience;
};

export type BlastResult = {
  blast: BlastRecord | null;
  testSentTo: string | null;
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

export const listBlasts = (eventId: string) =>
  call(() => http.get<{ data: BlastOverview }>(`/admin/events/${eventId}/blasts`));

export const sendBlast = (eventId: string, input: BlastInput) =>
  call(() =>
    http.post<{ data: BlastResult }>(`/admin/events/${eventId}/blasts`, input)
  );

export const sendTestBlast = (eventId: string, input: BlastInput) =>
  call(() =>
    http.post<{ data: BlastResult }>(`/admin/events/${eventId}/blasts`, {
      ...input,
      testOnly: true,
    })
  );