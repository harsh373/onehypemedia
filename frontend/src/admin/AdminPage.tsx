import { useEffect, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { getMe, logout } from "../api/auth";
import LoginForm from "./LoginForm";
import AdminLayout from "./AdminLayout";
import EventsList from "./EventsList";
import EventForm from "./EventForm";
import EventWorkspace from "./EventWorkspace";
import UsersList from "./UsersList";
import UserDetail from "./UserDetail";

type Status = "loading" | "loggedOut" | "loggedIn";

function EventsRoute({ onNotice }: { onNotice: (message: string) => void }) {
  const navigate = useNavigate();
  return (
    <EventsList
      onCreate={() => navigate("/adminn/events/new")}
      onOpen={(id) => navigate(`/adminn/events/${id}`)}
      onEdit={(id) => navigate(`/adminn/events/${id}/edit`)}
      onNotice={onNotice}
    />
  );
}

function EventFormRoute({ onNotice }: { onNotice: (message: string) => void }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const eventId = id ?? null;
  return (
    <EventForm
      key={eventId ?? "new"}
      eventId={eventId}
      onDone={(message, savedId) => {
        onNotice(message);
        navigate(`/adminn/events/${savedId}`);
      }}
      onCancel={() =>
        navigate(eventId ? `/adminn/events/${eventId}` : "/adminn")
      }
    />
  );
}

function EventWorkspaceRoute({
  onNotice,
}: {
  onNotice: (message: string) => void;
}) {
  const navigate = useNavigate();
  return (
    <EventWorkspace
      onOpenUser={(id) => navigate(`/adminn/users/${id}`)}
      onNotice={onNotice}
    />
  );
}

function UsersRoute() {
  const navigate = useNavigate();
  return <UsersList onOpenUser={(id) => navigate(`/adminn/users/${id}`)} />;
}

function UserDetailRoute() {
  const { id } = useParams();
  const navigate = useNavigate();
  if (!id) return <Navigate to="/adminn/users" replace />;
  return (
    <UserDetail
      key={id}
      userId={id}
      onBack={() => navigate("/adminn/users")}
      onOpenEvent={(eventId) => navigate(`/adminn/events/${eventId}`)}
    />
  );
}

export default function AdminPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [notice, setNotice] = useState("");
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    getMe().then((ok) => setStatus(ok ? "loggedIn" : "loggedOut"));
  }, []);

  useEffect(() => {
    const onUnauthorized = () => setStatus("loggedOut");
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
      navigate("/adminn");
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
    const active = pathname.startsWith("/adminn/users") ? "users" : "events";

    content = (
      <AdminLayout
        active={active}
        onEvents={() => navigate("/adminn")}
        onUsers={() => navigate("/adminn/users")}
        onLogout={handleLogout}
      >
        {notice && (
          <p className="mb-6 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white">
            {notice}
          </p>
        )}
        <Routes>
          <Route path="/" element={<EventsRoute onNotice={setNotice} />} />
          <Route
            path="events/new"
            element={<EventFormRoute onNotice={setNotice} />}
          />
          <Route
            path="events/:id/edit"
            element={<EventFormRoute onNotice={setNotice} />}
          />
          <Route
            path="events/:id/*"
            element={<EventWorkspaceRoute onNotice={setNotice} />}
          />
          <Route path="users" element={<UsersRoute />} />
          <Route path="users/:id" element={<UserDetailRoute />} />
          <Route path="*" element={<Navigate to="/adminn" replace />} />
        </Routes>
      </AdminLayout>
    );
  }

  return (
    <div
      data-lenis-prevent
      className={`fixed inset-0 z-[9999] overflow-y-auto ${
        status === "loggedIn" ? "bg-[#131315]" : "bg-white"
      }`}
    >
      {content}
    </div>
  );
}