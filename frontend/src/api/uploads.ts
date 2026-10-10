import axios from "axios";
import { http, getErrorMessage } from "./http";

type Signature = {
  allowed_formats: string;
  folder: string;
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
};

export async function uploadImage(
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ url: string; publicId: string }> {
  let sig: Signature;
  try {
    const res = await http.post<{ data: Signature }>("/admin/uploads/sign");
    sig = res.data.data;
  } catch (err) {
    throw new Error(getErrorMessage(err), { cause: err });
  }

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("signature", sig.signature);
  form.append("folder", sig.folder);
  form.append("allowed_formats", sig.allowed_formats);

  try {
    const res = await axios.post(
      `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
      form,
      {
        onUploadProgress: (e) => {
          if (e.total && onProgress) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        },
      }
    );
    return { url: res.data.secure_url, publicId: res.data.public_id };
  } catch (err) {
    throw new Error("Failed to upload image.", { cause: err });
  }
}