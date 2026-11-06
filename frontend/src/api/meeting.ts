import { http, getErrorMessage } from './http'

// Only works for a confirmed guest of an online event. Anyone else gets an error.
export async function getMeetingUrl(eventId: string): Promise<string> {
  try {
    const res = await http.get<{ data: { meetingUrl: string } }>(`/events/${eventId}/meeting`)
    return res.data.data.meetingUrl
  } catch (err) {
    throw new Error(getErrorMessage(err), { cause: err })
  }
}