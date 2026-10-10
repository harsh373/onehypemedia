type OwnUserLike = {
  _id: unknown;
  name: string;
  username: string;
  email: string;
  phone: string;
  bio: string;
  location: string;
};

type PublicProfileLike = {
  name: string;
  username: string;
  bio: string;
  location: string;
};

// Full shape. Only ever sent to the logged-in owner of the account.
export function publicUser(user: OwnUserLike) {
  return {
    id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone,
    bio: user.bio,
    location: user.location,
  };
}

// Public shape. Safe to send to anyone, including logged-out visitors.
export function publicProfile(user: PublicProfileLike) {
  return {
    name: user.name,
    username: user.username,
    bio: user.bio,
    location: user.location,
  };
}