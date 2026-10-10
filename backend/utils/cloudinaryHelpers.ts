import { cloudinary } from "../config/cloudinary";

export const UPLOAD_FOLDER = "onehype/events";

export async function destroyAssets(publicIds: string[]): Promise<void> {
  if (publicIds.length === 0) return;

  const results = await Promise.allSettled(
    publicIds.map((id) => cloudinary.uploader.destroy(id, { invalidate: true }))
  );

  results.forEach((result, i) => {
    if (result.status === "rejected") {
      console.error(`Cloudinary delete failed for ${publicIds[i]}:`, result.reason);
    } else if (
      result.value?.result !== "ok" &&
      result.value?.result !== "not found"
    ) {
      console.error(`Cloudinary delete unexpected result for ${publicIds[i]}:`, result.value);
    }
  });
}