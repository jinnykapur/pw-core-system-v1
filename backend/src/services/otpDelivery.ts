import nodemailer from "nodemailer";
import { env } from "../config/env";
import type { OtpPurpose } from "../models/Otp";
import { ApiError } from "../utils/ApiError";

function getOtpMessage(purpose: OtpPurpose, code: string) {
  switch (purpose) {
    case "signup":
      return {
        subject: "Welcome to PathWise - Verify your email",
        heading: "Complete your PathWise signup",
        intro: "You're one step away from your PathWise account. Use the one-time password below to verify your email and finish creating your account.",
        text: `Welcome to PathWise. Your email verification code is ${code}. It expires in ${env.OTP_TTL_MINUTES} minutes.`
      };
    case "reset-password":
      return {
        subject: "PathWise password reset verification",
        heading: "Reset your PathWise password",
        intro: "We received a request to reset your password. Use the one-time password below to continue securely.",
        text: `Your PathWise password reset code is ${code}. It expires in ${env.OTP_TTL_MINUTES} minutes.`
      };
    default:
      return {
        subject: "Your PathWise verification code",
        heading: "Verify your sign in",
        intro: "Use this one-time password to continue signing in to PathWise.",
        text: `Your PathWise verification code is ${code}. It expires in ${env.OTP_TTL_MINUTES} minutes.`
      };
  }
}

function buildOtpHtml(heading: string, intro: string, code: string) {
  return `
    <div style="margin:0;padding:36px 16px;background:linear-gradient(180deg,#031423 0%,#020617 100%);font-family:Arial,sans-serif;color:#e2e8f0;">
      <div style="max-width:560px;margin:0 auto;background:#0f172a;border:1px solid #1e293b;border-radius:24px;overflow:hidden;box-shadow:0 24px 80px rgba(2,6,23,0.55);">
        <div style="padding:28px;border-bottom:1px solid #1e293b;background:radial-gradient(circle at top left,rgba(34,197,94,0.18),transparent 45%),#0b1220;">
          <div style="display:inline-block;padding:10px 14px;border-radius:14px;background:linear-gradient(135deg,#22c55e,#10b981);color:#04130a;font-weight:700;">
            PathWise
          </div>
          <p style="margin:18px 0 0;font-size:13px;line-height:1.7;color:#94a3b8;">
            Smarter academic and career guidance, verified securely.
          </p>
        </div>
        <div style="padding:28px;">
          <h1 style="margin:0 0 12px;font-size:28px;line-height:1.2;color:#f8fafc;">${heading}</h1>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#cbd5e1;">${intro}</p>
          <div style="margin:24px 0;padding:18px 20px;border-radius:16px;background:#052e16;border:1px solid #166534;text-align:center;">
            <div style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#86efac;margin-bottom:10px;">One-Time Password</div>
            <div style="font-size:34px;letter-spacing:0.35em;font-weight:700;color:#f0fdf4;">${code}</div>
          </div>
          <p style="margin:0 0 10px;font-size:14px;line-height:1.7;color:#cbd5e1;">
            This code expires in ${env.OTP_TTL_MINUTES} minutes and can be used only once.
          </p>
          <p style="margin:0;font-size:13px;line-height:1.7;color:#94a3b8;">
            If you did not request this email, you can safely ignore it. This mailbox is used only for verification and account support.
          </p>
        </div>
      </div>
    </div>
  `;
}

export async function deliverOtp(email: string, code: string, purpose: OtpPurpose = "login") {
  const message = getOtpMessage(purpose, code);

  if (env.OTP_DELIVERY === "log") {
    // eslint-disable-next-line no-console
    console.log(`[otp] purpose=${purpose} email=${email} code=${code}`);
    return { delivered: "log" as const };
  }

  if (!env.SMTP_HOST || !env.SMTP_PORT || !env.SMTP_USER || !env.SMTP_PASS || !env.SMTP_FROM) {
    throw new ApiError(503, "OTP email is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM in backend/.env.");
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS }
  });

  try {
    await transporter.sendMail({
      from: `PathWise Support <${env.SMTP_FROM}>`,
      replyTo: env.SMTP_FROM,
      to: email,
      subject: message.subject,
      text: message.text,
      html: buildOtpHtml(message.heading, message.intro, code)
    });
  } catch (error) {
    throw new ApiError(502, "PathWise could not send the OTP email. Check the Gmail address or app password in backend/.env.", {
      cause: error instanceof Error ? error.message : "Unknown SMTP error"
    });
  }

  return { delivered: "smtp" as const };
}
