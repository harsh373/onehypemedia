import { useEffect, useState } from "react";
import { listAdminUsers, formatEventDate } from "../api/events";
import type { AdminUser } from "../api/events";

type Props = {
  onOpenUser: (id: string) => void;
};

type Result = { users: AdminUser[] } | { error: string } | null;

const th = "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/45 whitespace-nowrap";
const td = "px-4 py-3 whitespace-nowrap";

export default function UsersList({ onOpenUser }: Props) {
  const [result, setResult] = useState<Result>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    listAdminUsers()
      .then((users) => {
        if (!cancelled) setResult({ users });
      })
      .catch((e: Error) => {
        if (!cancelled) setResult({ error: e.message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (result === null) {
    return <p className="text-white/55">Loading users...</p>;
  }

  if ("error" in result) {
    return <p className="text-sm text-red-400">{result.error}</p>;
  }

  const q = query.trim().toLowerCase();
  const users = q
    ? result.users.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      )
    : result.users;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          Users{" "}
          <span className="text-xl font-normal text-white/45">
            {result.users.length}
          </span>
        </h1>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, username, email"
          className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm text-white outline-none ring-1 ring-transparent placeholder:text-white/40 focus:ring-white/30 sm:w-72"
        />
      </div>

      {users.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-white/15 px-6 py-12 text-center">
          <p className="text-lg font-semibold text-white/80">
            {result.users.length === 0 ? "No Users Yet" : "No Matches"}
          </p>
          <p className="mt-1 text-sm text-white/50">
            {result.users.length === 0
              ? "People who register on the site will show up here."
              : "Try a different name, username or email."}
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.04]">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10">
              <tr>
                <th className={th}>Name</th>
                <th className={th}>Username</th>
                <th className={th}>Email</th>
                <th className={th}>Phone</th>
                <th className={th}>Joined</th>
                <th className={th}>Events</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {users.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-white/[0.04]">
                  <td className={td}>
                    <button
                      type="button"
                      onClick={() => onOpenUser(u.id)}
                      className="font-semibold hover:underline"
                    >
                      {u.name}
                    </button>
                  </td>
                  <td className={`${td} text-white/70`}>@{u.username}</td>
                  <td className={`${td} text-white/70`}>{u.email}</td>
                  <td className={`${td} text-white/70`}>{u.phone || "-"}</td>
                  <td className={`${td} text-white/70`}>
                    {formatEventDate(u.createdAt)}
                  </td>
                  <td className={td}>{u.registeredCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}