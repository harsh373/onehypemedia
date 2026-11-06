import { http, getErrorMessage } from './http'

// "registered" means confirmed. "pending" is waiting for the host to approve.
export type ParticipationStatus =
  | 'registered'
  | 'pending'
  | 'declined'
  | 'cancelled'
  | null

export type MyEventItem = {
  id: string
  status: 'registered' | 'pending'
  registeredAt: string
  event: {
    id: string
    title: string
    slug: string
    date: string
    location: string
  }
}

export type MyEvents = {
  upcoming: MyEventItem[]
  past: MyEventItem[]
}

// Returns null on any failure so the button simply shows the default state.
export async function getMyParticipation(eventId: string): Promise<ParticipationStatus> {
  try {
    const res = await http.get<{ data: { status: ParticipationStatus } }>(`/events/${eventId}/participation`)
    return res.data.data.status
  } catch {
    return null
  }
}

export async function participate(eventId: string): Promise<ParticipationStatus> {
  try {
    const res = await http.post<{ data: { status: ParticipationStatus } }>(`/events/${eventId}/participate`)
    return res.data.data.status
  } catch (err) {
    throw new Error(getErrorMessage(err), { cause: err })
  }
}

export async function cancelParticipation(eventId: string): Promise<ParticipationStatus> {
  try {
    const res = await http.delete<{ data: { status: ParticipationStatus } }>(`/events/${eventId}/participate`)
    return res.data.data.status
  } catch (err) {
    throw new Error(getErrorMessage(err), { cause: err })
  }
}

export async function getMyEvents(): Promise<MyEvents | null> {
  try {
    const res = await http.get<{ data: MyEvents }>('/users/me/participations')
    return res.data.data
  } catch {
    return null
  }
}