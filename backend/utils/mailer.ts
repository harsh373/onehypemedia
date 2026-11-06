import { createTransport, type Transporter } from "nodemailer";
import { env } from "../config/env";

let transporter: Transporter | null = null;

export function isMailConfigured(): boolean {
  return Boolean(env.smtpHost && env.smtpUser && env.smtpPass);
}

function fromAddress(): string {
  return env.mailFrom || env.smtpUser;
}

// Where "Send test to me" goes.
export function getAdminEmail(): string {
  return env.adminEmail || env.smtpUser;
}

// Created on first use, so the server never needs mail settings just to start.
function getTransporter(): Transporter {
  if (!transporter) {
    transporter = createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: { user: env.smtpUser, pass: env.smtpPass },
    });
  }
  return transporter;
}

export type MailInput = {
  to?: string;
  bcc?: string[];
  subject: string;
  text: string;
  html: string;
};

// When only bcc is given, "to" is the sender itself, so guests never see each other.
export async function sendMail(input: MailInput): Promise<void> {
  await getTransporter().sendMail({
    from: fromAddress(),
    to: input.to ?? fromAddress(),
    bcc: input.bcc,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}