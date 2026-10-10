export type Crop = { x: number; y: number; width: number; height: number };

// Width / height of the cover box on the public site (Hype Lab cards and event hero).
// The crop frame in the admin uses this same number. Do not change it casually:
// existing covers were cropped to this ratio.
export const COVER_ASPECT = 16 / 9;

// Width / height of every gallery tile on the public event page.
export const GALLERY_ASPECT = 4 / 3;

export const MAX_GALLERY_IMAGES = 30;
export const MAX_IMAGE_MB = 10;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type CoverState =
  | {
      kind: "existing";
      url: string;
      publicId: string;
      crop: Crop;
      previewUrl: string;
    }
  | {
      kind: "new";
      file: File;
      sourceUrl: string;
      crop: Crop;
      previewUrl: string;
    }
  | null;

export type GalleryItem =
  | {
      key: string;
      kind: "existing";
      url: string;
      publicId: string;
      crop: Crop;
      previewUrl: string;
    }
  | {
      key: string;
      kind: "new";
      file: File;
      sourceUrl: string;
      crop: Crop;
      previewUrl: string;
    };

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Unsupported format. Use JPG, PNG or WebP.";
  }
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
    return `Image is too large (max ${MAX_IMAGE_MB} MB).`;
  }
  return null;
}

export function newKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Builds the delivery URL: crop to the saved area, cap the width, auto format/quality.
export function imageUrl(
  image: { url: string; crop?: Crop },
  width = 1200
): string {
  const marker = "/upload/";
  const index = image.url.indexOf(marker);
  if (index === -1) return image.url;

  const steps: string[] = [];
  if (image.crop) {
    const { x, y, width: w, height: h } = image.crop;
    steps.push(
      `c_crop,x_${Math.round(x)},y_${Math.round(y)},w_${Math.round(w)},h_${Math.round(h)}`
    );
  }
  steps.push(`c_limit,w_${width}`, "f_auto,q_auto");

  const cut = index + marker.length;
  return `${image.url.slice(0, cut)}${steps.join("/")}/${image.url.slice(cut)}`;
}

// The largest centered crop of the given aspect ratio that fits inside the image.
export function defaultCrop(
  naturalWidth: number,
  naturalHeight: number,
  aspect: number
): Crop {
  let width = naturalWidth;
  let height = naturalWidth / aspect;
  if (height > naturalHeight) {
    height = naturalHeight;
    width = naturalHeight * aspect;
  }
  return {
    x: Math.round((naturalWidth - width) / 2),
    y: Math.round((naturalHeight - height) / 2),
    width: Math.round(width),
    height: Math.round(height),
  };
}

export function loadImageSize(
  src: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Could not load image."));
    img.src = src;
  });
}

// Draws the cropped area into a small canvas and returns a temporary local URL.
export function cropToPreviewUrl(
  src: string,
  crop: Crop,
  width = 800
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const height = Math.round(width * (crop.height / crop.width));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas is not supported."));
        return;
      }
      ctx.drawImage(
        img,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        width,
        height
      );
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(URL.createObjectURL(blob))
            : reject(new Error("Preview failed.")),
        "image/jpeg",
        0.9
      );
    };
    img.onerror = () => reject(new Error("Could not load image."));
    img.src = src;
  });
}