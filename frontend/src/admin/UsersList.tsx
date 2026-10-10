import { useEffect, useState } from "react";
import { listAdminUsers, formatEventDate } from "../api/events";
import type { AdminUser } from "../api/events";

type Props = {
  onOpenUser: (id: string) => void;
};

type Result = { users: AdminUser[] } | { error: string } | null;

const th = { padding: "10px 12px", textAlign: "left" as const, whiteSpace: "nowrap" as const };
const td = { padding: "12px", whiteSpace: "nowrap" as const };

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
    return <p className="text-neutral-500">Loading users...</p>;
  }

  if ("error" in result) {
    return <p className="text-sm text-[#e31d25]">{result.error}</p>;
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
      <div className="flex flex-wrap items-center justify-between" style={{ gap: 16 }}>
        <h1 className="text-2xl font-extrabold tracking-tight">USERS ({result.users.length})</h1>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, username, email" className="w-full border border-neutral-300 px-4 py-2 text-sm outline-none focus:border-neutral-950 sm:w-72" />
      </div>

      {users.length === 0 ? (
        <p className="text-neutral-500" style={{ marginTop: 32 }}>
          {result.users.length === 0 ? "No users have registered yet." : "No users match your search."}
        </p>
      ) : (
        <div className="overflow-x-auto border border-neutral-200" style={{ marginTop: 24 }}>
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-xs font-semibold tracking-widest text-neutral-500">
              <tr>
                <th style={th}>NAME</th>
                <th style={th}>USERNAME</th>
                <th style={th}>EMAIL</th>
                <th style={th}>PHONE</th>
                <th style={th}>JOINED</th>
                <th style={th}>EVENTS</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-neutral-200">
                  <td style={td}>
                    <button onClick={() => onOpenUser(u.id)} className="font-semibold underline">{u.name}</button>
                  </td>
                  <td style={td}>@{u.username}</td>
                  <td style={td}>{u.email}</td>
                  <td style={td}>{u.phone || "-"}</td>
                  <td style={td}>{formatEventDate(u.createdAt)}</td>
                  <td style={td}>{u.registeredCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}