import { env } from "../config/env";
import { UPLOAD_FOLDER } from "./cloudinaryHelpers";

export type ImageInput = {
  url: string;
  publicId: string;
  crop: { x: number; y: number; width: number; height: number };
};

export type GalleryInput = ImageInput & { order: number };

export type LocationType = "in-person" | "online";
export type Visibility = "public" | "private";

export type EventInput = {
  title: string;
  description: string;
  date: Date;
  endDate: Date | null;
  timezone: string;
  location: string;
  locationType: LocationType;
  meetingUrl: string;
  lat: number | null;
  lng: number | null;
  capacity: number | null;
  requireApproval: boolean;
  visibility: Visibility;
  theme: string;
  coverImage: ImageInput;
  gallery: GalleryInput[];
};

export const MAX_GALLERY_IMAGES = 30;
export const MAX_CAPACITY = 100000;
export const THEME_IDS = ["minimal", "dark", "violet", "ember", "ocean", "forest"];

const ALLOWED_TIMEZONES = ["Asia/Kolkata"];
const DEFAULT_TIMEZONE = "Asia/Kolkata";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

function parseImage(raw: unknown): ImageInput | null {
  const c = (raw ?? {}) as Record<string, unknown>;
  const crop = (c.crop ?? {}) as Record<string, unknown>;
  const { url, publicId } = c;

  if (typeof url !== "string" || typeof publicId !== "string") return null;
  if (!url.startsWith(`https://res.cloudinary.com/${env.cloudinaryCloudName}/`)) {
    return null;
  }
  if (!publicId.startsWith(`${UPLOAD_FOLDER}/`) || publicId.includes("..")) {
    return null;
  }

  const { x, y, width, height } = crop;
  const numbers = [x, y, width, height];
  const allValid = numbers.every(
    (n) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 30000
  );
  if (!allValid) return null;
  if ((width as number) <= 0 || (height as number) <= 0) return null;

  return {
    url,
    publicId,
    crop: {
      x: Math.round(x as number),
      y: Math.round(y as number),
      width: Math.round(width as number),
      height: Math.round(height as number),
    },
  };
}

// Accepts either an old date-only value (YYYY-MM-DD) or a full ISO date and time.
function parseInstant(value: unknown): { date: Date; hasTime: boolean } | null {
  if (typeof value !== "string") return null;
  const dateOnly = DATE_ONLY.test(value);
  if (!dateOnly && !ISO_DATETIME.test(value)) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return { date, hasTime: !dateOnly };
}

function parseHttpUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

// null = not provided, undefined = provided but invalid.
function parseCoordinate(
  raw: unknown,
  min: number,
  max: number
): number | null | undefined {
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw !== "number" || !Number.isFinite(raw)) return undefined;
  if (raw < min || raw > max) return undefined;
  return raw;
}

export function parseEventInput(body: unknown): {
  data?: EventInput;
  error?: string;
} {
  const b = (body ?? {}) as Record<string, unknown>;

  const title = typeof b.title === "string" ? b.title.trim() : "";
  const description =
    typeof b.description === "string" ? b.description.trim() : "";

  if (!title) return { error: "Title is required." };
  if (title.length > 150) return { error: "Title is too long (max 150)." };
  if (!description) return { error: "Description is required." };
  if (description.length > 10000) {
    return { error: "Description is too long (max 10000)." };
  }

  // Start and end
  const start = parseInstant(b.date);
  if (!start) return { error: "A valid start date is required." };

  let timezone = "";
  if (start.hasTime) {
    timezone = typeof b.timezone === "string" && b.timezone ? b.timezone : DEFAULT_TIMEZONE;
    if (!ALLOWED_TIMEZONES.includes(timezone)) {
      return { error: "Unsupported timezone." };
    }
  }

  let endDate: Date | null = null;
  if (b.endDate !== undefined && b.endDate !== null && b.endDate !== "") {
    const end = parseInstant(b.endDate);
    if (!end || !end.hasTime || !start.hasTime) {
      return { error: "A valid end date and time is required." };
    }
    if (end.date.getTime() <= start.date.getTime()) {
      return { error: "The end must be after the start." };
    }
    endDate = end.date;
  }

  // Location
  const locationType: LocationType =
    b.locationType === undefined ? "in-person" : (b.locationType as LocationType);
  if (locationType !== "in-person" && locationType !== "online") {
    return { error: "Location type must be in-person or online." };
  }

  let location = "";
  let meetingUrl = "";
  let lat: number | null = null;
  let lng: number | null = null;

  if (locationType === "online") {
    const rawUrl = typeof b.meetingUrl === "string" ? b.meetingUrl.trim() : "";
    if (!rawUrl) return { error: "A meeting link is required for online events." };
    if (rawUrl.length > 500) return { error: "Meeting link is too long (max 500)." };
    const url = parseHttpUrl(rawUrl);
    if (!url) return { error: "The meeting link must be a valid web address." };
    meetingUrl = url;
    location = "Online";
  } else {
    location = typeof b.location === "string" ? b.location.trim() : "";
    if (!location) return { error: "Location is required." };
    if (location.length > 150) {
      return { error: "Location is too long (max 150)." };
    }

    const parsedLat = parseCoordinate(b.lat, -90, 90);
    const parsedLng = parseCoordinate(b.lng, -180, 180);
    if (
      parsedLat === undefined ||
      parsedLng === undefined ||
      (parsedLat === null) !== (parsedLng === null)
    ) {
      return { error: "Map coordinates are invalid." };
    }
    lat = parsedLat;
    lng = parsedLng;
  }

  // Options
  let capacity: number | null = null;
  if (b.capacity !== undefined && b.capacity !== null && b.capacity !== "") {
    if (
      typeof b.capacity !== "number" ||
      !Number.isInteger(b.capacity) ||
      b.capacity < 1 ||
      b.capacity > MAX_CAPACITY
    ) {
      return { error: `Capacity must be a whole number from 1 to ${MAX_CAPACITY}.` };
    }
    capacity = b.capacity;
  }

  if (b.requireApproval !== undefined && typeof b.requireApproval !== "boolean") {
    return { error: "Require approval must be true or false." };
  }
  const requireApproval = b.requireApproval === true;

  const visibility: Visibility =
    b.visibility === undefined ? "public" : (b.visibility as Visibility);
  if (visibility !== "public" && visibility !== "private") {
    return { error: "Visibility must be public or private." };
  }

  const theme = b.theme === undefined ? "minimal" : b.theme;
  if (typeof theme !== "string" || !THEME_IDS.includes(theme)) {
    return { error: "Unknown theme." };
  }

  // Images
  const coverImage = parseImage(b.coverImage);
  if (!coverImage) return { error: "Cover image is required." };

  const rawGallery = b.gallery === undefined ? [] : b.gallery;
  if (!Array.isArray(rawGallery)) {
    return { error: "Gallery must be a list of images." };
  }
  if (rawGallery.length > MAX_GALLERY_IMAGES) {
    return { error: `A gallery can have at most ${MAX_GALLERY_IMAGES} images.` };
  }

  const seen = new Set<string>([coverImage.publicId]);
  const gallery: GalleryInput[] = [];
  for (const raw of rawGallery) {
    const image = parseImage(raw);
    if (!image) return { error: "One of the gallery images is invalid." };
    if (seen.has(image.publicId)) {
      return { error: "The same image was added twice." };
    }
    seen.add(image.publicId);
    gallery.push({ ...image, order: gallery.length });
  }

  return {
    data: {
      title,
      description,
      date: start.date,
      endDate,
      timezone,
      location,
      locationType,
      meetingUrl,
      lat,
      lng,
      capacity,
      requireApproval,
      visibility,
      theme,
      coverImage,
      gallery,
    },
  };
}