import { Request, Response } from "express";
import { cloudinary } from "../config/cloudinary";
import { env } from "../config/env";
import { UPLOAD_FOLDER } from "../utils/cloudinaryHelpers";

export function signUpload(_req: Request, res: Response): void {
  const params = {
    allowed_formats: "jpg,jpeg,png,webp",
    folder: UPLOAD_FOLDER,
    timestamp: Math.round(Date.now() / 1000),
  };

  const signature = cloudinary.utils.api_sign_request(
    params,
    env.cloudinaryApiSecret
  );

  res.json({
    success: true,
    data: {
      ...params,
      signature,
      apiKey: env.cloudinaryApiKey,
      cloudName: env.cloudinaryCloudName,
    },
  });
}