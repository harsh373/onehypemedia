import { http, getErrorMessage } from './http'

export type CurrentUser = {
  id: string
  name: string
  username: string
  email: string
  phone: string
  bio: string
  location: string
}

export type PublicProfile = {
  name: string
  username: string
  bio: string
  location: string
}

type RegisterInput = {
  name: string
  username: string
  email: string
  password: string
  confirmPassword: string
}

export type ProfileInput = {
  name: string
  phone: string
  bio: string
  location: string
}

export async function registerUser(input: RegisterInput): Promise<CurrentUser> {
  try {
    const res = await http.post<{ data: CurrentUser }>('/auth/register', input)
    return res.data.data
  } catch (err) {
    throw new Error(getErrorMessage(err), { cause: err })
  }
}

export async function loginUser(email: string, password: string): Promise<CurrentUser> {
  try {
    const res = await http.post<{ data: CurrentUser }>('/auth/login', { email, password })
    return res.data.data
  } catch (err) {
    throw new Error(getErrorMessage(err), { cause: err })
  }
}

export async function googleLogin(credential: string): Promise<CurrentUser> {
  try {
    const res = await http.post<{ data: CurrentUser }>('/auth/google', { credential })
    return res.data.data
  } catch (err) {
    throw new Error(getErrorMessage(err), { cause: err })
  }
}

export async function logoutUser(): Promise<void> {
  await http.post('/auth/logout')
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const res = await http.get<{ data: CurrentUser }>('/auth/me')
    return res.data.data
  } catch {
    return null
  }
}

export async function updateMyProfile(input: ProfileInput): Promise<CurrentUser> {
  try {
    const res = await http.put<{ data: CurrentUser }>('/users/me/profile', input)
    return res.data.data
  } catch (err) {
    throw new Error(getErrorMessage(err), { cause: err })
  }
}

export async function getPublicProfile(username: string): Promise<PublicProfile | null> {
  try {
    const res = await http.get<{ data: PublicProfile }>(`/users/${encodeURIComponent(username)}`)
    return res.data.data
  } catch {
    return null
  }
}