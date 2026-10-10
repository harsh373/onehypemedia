import axios from "axios";

export const http = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  withCredentials: true,
});

http.interceptors.response.use(
  (response) => response,
  (err) => {
    if (
      axios.isAxiosError(err) &&
      err.response?.status === 401 &&
      err.config?.url?.startsWith("/admin")
    ) {
      window.dispatchEvent(new Event("admin-unauthorized"));
    }
    return Promise.reject(err);
  }
);

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return (
      err.response?.data?.message ?? "Something went wrong. Please try again."
    );
  }
  return "Something went wrong. Please try again.";
}