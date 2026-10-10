import { env } from "../config/env";
import { UPLOAD_FOLDER } from "./cloudinaryHelpers";

export type ImageInput = {
  url: string;
  publicId: string;
  crop: { x: number; y: number; width: number; height: number };
};

export type GalleryInput = ImageInput & { order: number };

export type EventInput = {
  title: string;
  description: string;
  date: Date;
  location: string;
  coverImage: ImageInput;
  gallery: GalleryInput[];
};

export const MAX_GALLERY_IMAGES = 30;

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

export function parseEventInput(body: unknown): {
  data?: EventInput;
  error?: string;
} {
  const b = (body ?? {}) as Record<string, unknown>;

  const title = typeof b.title === "string" ? b.title.trim() : "";
  const description =
    typeof b.description === "string" ? b.description.trim() : "";
  const location = typeof b.location === "string" ? b.location.trim() : "";

  if (!title) return { error: "Title is required." };
  if (title.length > 150) return { error: "Title is too long (max 150)." };
  if (!description) return { error: "Description is required." };
  if (description.length > 10000) {
    return { error: "Description is too long (max 10000)." };
  }
  if (!location) return { error: "Location is required." };
  if (location.length > 150) return { error: "Location is too long (max 150)." };

  if (typeof b.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(b.date)) {
    return { error: "A valid date is required." };
  }
  const date = new Date(b.date);
  if (Number.isNaN(date.getTime())) {
    return { error: "A valid date is required." };
  }

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

  return { data: { title, description, date, location, coverImage, gallery } };
}