import { Event } from "../models/Event";

function baseSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "event";
}

export async function uniqueSlug(title: string): Promise<string> {
  const base = baseSlug(title);
  let slug = base;
  let n = 2;
  while (await Event.exists({ slug })) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}