import { useEffect, useState } from "react";
import { getMe, logout } from "../api/auth";
import LoginForm from "./LoginForm";
import AdminLayout from "./AdminLayout";
import EventsList from "./EventsList";
import EventForm from "./EventForm";
import UsersList from "./UsersList";
import UserDetail from "./UserDetail";
import EventParticipants from "./EventsParticipants";

type Status = "loading" | "loggedOut" | "loggedIn";
type View =
  | { name: "list" }
  | { name: "form"; id: string | null }
  | { name: "users" }
  | { name: "user"; id: string };

export default function AdminPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [view, setView] = useState<View>({ name: "list" });
  const [notice, setNotice] = useState("");

  useEffect(() => {
    getMe().then((ok) => setStatus(ok ? "loggedIn" : "loggedOut"));
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      setStatus("loggedOut");
      setView({ name: "list" });
    };
    window.addEventListener("admin-unauthorized", onUnauthorized);
    return () =>
      window.removeEventListener("admin-unauthorized", onUnauthorized);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      setStatus("loggedOut");
      setView({ name: "list" });
    }
  }

  let content;

  if (status === "loading") {
    content = (
      <div className="flex min-h-screen items-center justify-center bg-white text-neutral-500">
        Loading...
      </div>
    );
  } else if (status === "loggedOut") {
    content = <LoginForm onSuccess={() => setStatus("loggedIn")} />;
  } else {
    const active = view.name === "users" || view.name === "user" ? "users" : "events";

    let body;
    if (view.name === "list") {
      body = (
        <EventsList
          onCreate={() => setView({ name: "form", id: null })}
          onEdit={(id) => setView({ name: "form", id })}
          onNotice={setNotice}
        />
      );
    } else if (view.name === "form") {
      body = (
        <>
          <EventForm
            key={view.id ?? "new"}
            eventId={view.id}
            onDone={(message) => {
              setNotice(message);
              setView({ name: "list" });
            }}
            onCancel={() => setView({ name: "list" })}
          />
          {view.id && (
            <EventParticipants
              key={`participants-${view.id}`}
              eventId={view.id}
              onOpenUser={(id) => setView({ name: "user", id })}
            />
          )}
        </>
      );
    } else if (view.name === "users") {
      body = <UsersList onOpenUser={(id) => setView({ name: "user", id })} />;
    } else {
      body = (
        <UserDetail
          key={view.id}
          userId={view.id}
          onBack={() => setView({ name: "users" })}
          onOpenEvent={(id) => setView({ name: "form", id })}
        />
      );
    }

    content = (
      <AdminLayout
        active={active}
        onEvents={() => setView({ name: "list" })}
        onUsers={() => setView({ name: "users" })}
        onLogout={handleLogout}
      >
        {notice && (
          <p className="mb-6 border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-semibold">
            {notice}
          </p>
        )}
        {body}
      </AdminLayout>
    );
  }

  return (
    <div
      data-lenis-prevent
      className="fixed inset-0 z-[9999] overflow-y-auto bg-white"
    >
      {content}
    </div>
  );
}