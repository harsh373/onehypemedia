import "dotenv/config";

const required = [
  "MONGODB_URI",
  "SESSION_SECRET",
  "ADMIN_PASSWORD_HASH",
  "CLIENT_URL",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
] as const;

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  port: Number(process.env.PORT) || 4000,
  isProd: process.env.NODE_ENV === "production",
  mongoUri: process.env.MONGODB_URI as string,
  sessionSecret: process.env.SESSION_SECRET as string,
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH as string,
  clientUrl: process.env.CLIENT_URL as string,
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY as string,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET as string,
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  // Email is optional: if these are missing the server still starts,
  // and the blast endpoints answer 503.
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: Number(process.env.SMTP_PORT) || 465,
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  mailFrom: process.env.MAIL_FROM ?? "",
  adminEmail: process.env.ADMIN_EMAIL ?? "",
};