import { type ReactNode } from "react";

type Props = {
  active: "events" | "users";
  onEvents: () => void;
  onUsers: () => void;
  onLogout: () => void;
  children: ReactNode;
};

const navClass = (isActive: boolean) =>
  `transition-colors ${
    isActive ? "text-white" : "text-white/55 hover:text-white"
  }`;

export default function AdminLayout({
  active,
  onEvents,
  onUsers,
  onLogout,
  children,
}: Props) {
  return (
    <div
      className="min-h-screen bg-[#131315] text-white"
      style={{
        backgroundImage:
          "linear-gradient(to bottom, #271e4d 0px, rgba(19,19,21,0) 360px)",
        backgroundRepeat: "no-repeat",
      }}
    >
      <header>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
          <span className="text-base font-extrabold tracking-tight">
            ONEHYPE <span className="text-[#e31d25]">ADMIN</span>
          </span>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <button onClick={onEvents} className={navClass(active === "events")}>
              Events
            </button>
            <button onClick={onUsers} className={navClass(active === "users")}>
              Users
            </button>
            <button
              onClick={onLogout}
              className="text-white/40 transition-colors hover:text-white"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-6">{children}</main>
    </div>
  );
}