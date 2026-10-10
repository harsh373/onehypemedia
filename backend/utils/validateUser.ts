const USERNAME_RE = /^[a-z0-9_]{3,30}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type RegisterInput = {
  name: string;
  username: string;
  email: string;
  password: string;
};

export type ProfileUpdateInput = {
  name: string;
  phone: string;
  bio: string;
  location: string;
};

export function parseRegisterInput(body: unknown): {
  data?: RegisterInput;
  error?: string;
} {
  const b = (body ?? {}) as Record<string, unknown>;

  const name = typeof b.name === "string" ? b.name.trim() : "";
  const username =
    typeof b.username === "string" ? b.username.trim().toLowerCase() : "";
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const password = typeof b.password === "string" ? b.password : "";
  const confirmPassword =
    typeof b.confirmPassword === "string" ? b.confirmPassword : "";

  if (!name) return { error: "Name is required." };
  if (name.length > 100) return { error: "Name is too long." };

  if (!USERNAME_RE.test(username)) {
    return {
      error:
        "Username must be 3-30 characters: lowercase letters, numbers and underscores only.",
    };
  }

  if (!EMAIL_RE.test(email)) return { error: "A valid email is required." };

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  return { data: { name, username, email, password } };
}

export function parseLoginInput(body: unknown): {
  email?: string;
  password?: string;
  error?: string;
} {
  const b = (body ?? {}) as Record<string, unknown>;
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const password = typeof b.password === "string" ? b.password : "";

  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  return { email, password };
}

export function parseProfileUpdate(body: unknown): {
  data?: ProfileUpdateInput;
  error?: string;
} {
  const b = (body ?? {}) as Record<string, unknown>;

  const name = typeof b.name === "string" ? b.name.trim() : "";
  const phone = typeof b.phone === "string" ? b.phone.trim() : "";
  const bio = typeof b.bio === "string" ? b.bio.trim() : "";
  const location = typeof b.location === "string" ? b.location.trim() : "";

  if (!name) return { error: "Name is required." };
  if (name.length > 100) return { error: "Name must be 100 characters or less." };
  if (phone.length > 20) return { error: "Phone must be 20 characters or less." };
  if (bio.length > 500) return { error: "Bio must be 500 characters or less." };
  if (location.length > 150) {
    return { error: "Location must be 150 characters or less." };
  }

  return { data: { name, phone, bio, location } };
}