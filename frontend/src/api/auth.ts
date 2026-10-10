import axios from "axios";
import { http } from "./http";

const FALLBACK = "Something went wrong. Please try again.";

export async function login(password: string): Promise<void> {
  try {
    await http.post("/admin/login", { password });
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(err.response?.data?.message ?? FALLBACK, { cause: err });
    }
    throw new Error(FALLBACK, { cause: err });
  }
}

export async function logout(): Promise<void> {
  await http.post("/admin/logout");
}

export async function getMe(): Promise<boolean> {
  try {
    await http.get("/admin/me");
    return true;
  } catch {
    return false;
  }
}