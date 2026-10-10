import { type ReactNode } from "react";

type Props = {
  active: "events" | "users";
  onEvents: () => void;
  onUsers: () => void;
  onLogout: () => void;
  children: ReactNode;
};

export default function AdminLayout({ active, onEvents, onUsers, onLogout, children }: Props) {
  return (
    <div className="min-h-screen bg-white text-neutral-950">
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <span className="text-lg font-extrabold tracking-tight">
            ONEHYPE <span className="text-[#e31d25]">ADMIN</span>
          </span>
          <nav className="flex items-center text-sm font-semibold tracking-widest" style={{ gap: 24 }}>
            <button onClick={onEvents} className={active === "events" ? "text-[#e31d25]" : ""}>EVENTS</button>
            <button onClick={onUsers} className={active === "users" ? "text-[#e31d25]" : ""}>USERS</button>
            <button onClick={onLogout} className="text-neutral-500 hover:text-neutral-950">LOGOUT</button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}