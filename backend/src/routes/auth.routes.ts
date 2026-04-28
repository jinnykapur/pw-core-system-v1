import { Router } from "express";
import { z } from "zod";
import { UserModel } from "../models/User";
import { ApiError } from "../utils/ApiError";
import { hashPassword, verifyPassword } from "../utils/password";
import { signAccessToken } from "../utils/jwt";
import { setAuthCookie, clearAuthCookie } from "../utils/cookies";
import { env } from "../config/env";
import { requireAuth } from "../middleware/auth";
import { OtpModel } from "../models/Otp";
import { generateOtpCode, hashOtp, verifyOtp } from "../utils/otp";
import { deliverOtp } from "../services/otpDelivery";

export const authRouter = Router();

const signupSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(200)
});

authRouter.post("/signup", async (req, res, next) => {
  try {
    const body = signupSchema.parse(req.body);
    const existing = await UserModel.findOne({ email: body.email }).lean();
    if (existing) throw new ApiError(409, "Email already in use");

    const passwordHash = await hashPassword(body.password);
    const user = await UserModel.create({
      name: body.name,
      email: body.email,
      passwordHash,
      role: "user"
    });

    const token = signAccessToken({ sub: user._id.toString(), role: user.role });
    setAuthCookie(res, token);

    res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await UserModel.findOne({ email: body.email });
    if (!user) throw new ApiError(401, "Invalid credentials");

    const ok = await verifyPassword(body.password, user.passwordHash);
    if (!ok) throw new ApiError(401, "Invalid credentials");

    const token = signAccessToken({ sub: user._id.toString(), role: user.role });
    setAuthCookie(res, token);

    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
});

// OTP flow (2-step). Use for advanced login/signup.
const requestOtpSchema = z.object({
  purpose: z.enum(["signup", "login", "reset-password"]),
  email: z.string().email(),
  name: z.string().min(2).max(80).optional(),
  password: z.string().min(8).max(200).optional()
});

authRouter.post("/request-otp", async (req, res, next) => {
  try {
    const body = requestOtpSchema.parse(req.body);
    const email = body.email.toLowerCase();

    if (body.purpose === "signup") {
      if (!body.name || !body.password) throw new ApiError(400, "Name and password are required for signup OTP");
      const existing = await UserModel.findOne({ email }).lean();
      if (existing) throw new ApiError(409, "Email already in use");

      const code = generateOtpCode();
      const codeHash = await hashOtp(code);
      const passwordHash = await hashPassword(body.password);

      await OtpModel.updateOne(
        { email, purpose: "signup" },
        {
          $set: {
            codeHash,
            attempts: 0,
            expiresAt: new Date(Date.now() + env.OTP_TTL_MINUTES * 60_000),
            payload: { name: body.name, passwordHash }
          }
        },
        { upsert: true }
      );

      const delivery = await deliverOtp(email, code, "signup");
      return res.json({ ok: true, delivery });
    }

    if (body.purpose === "reset-password") {
      const user = await UserModel.findOne({ email });
      if (!user) throw new ApiError(404, "No account found for that email");

      const code = generateOtpCode();
      const codeHash = await hashOtp(code);

      await OtpModel.updateOne(
        { email, purpose: "reset-password" },
        {
          $set: {
            codeHash,
            attempts: 0,
            expiresAt: new Date(Date.now() + env.OTP_TTL_MINUTES * 60_000),
            payload: { userId: user._id.toString() }
          }
        },
        { upsert: true }
      );

      const delivery = await deliverOtp(email, code, "reset-password");
      return res.json({ ok: true, delivery });
    }

    // login OTP: validate credentials first, then send OTP.
    if (!body.password) throw new ApiError(400, "Password is required for login OTP");
    const user = await UserModel.findOne({ email });
    if (!user) throw new ApiError(401, "Invalid credentials");
    const ok = await verifyPassword(body.password, user.passwordHash);
    if (!ok) throw new ApiError(401, "Invalid credentials");

    const code = generateOtpCode();
    const codeHash = await hashOtp(code);

    await OtpModel.updateOne(
      { email, purpose: "login" },
      {
        $set: {
          codeHash,
          attempts: 0,
          expiresAt: new Date(Date.now() + env.OTP_TTL_MINUTES * 60_000)
        }
      },
      { upsert: true }
    );

    const delivery = await deliverOtp(email, code, "login");
    return res.json({ ok: true, delivery });
  } catch (err) {
    next(err);
  }
});

const verifyOtpSchema = z.object({
  purpose: z.enum(["signup", "login"]),
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/)
});

authRouter.post("/verify-otp", async (req, res, next) => {
  try {
    const body = verifyOtpSchema.parse(req.body);
    const email = body.email.toLowerCase();
    const otp = await OtpModel.findOne({ email, purpose: body.purpose });
    if (!otp) throw new ApiError(400, "OTP not found. Request a new code.");
    if (otp.expiresAt.getTime() < Date.now()) {
      await otp.deleteOne();
      throw new ApiError(400, "OTP expired. Request a new code.");
    }
    if (otp.attempts >= env.OTP_MAX_ATTEMPTS) {
      await otp.deleteOne();
      throw new ApiError(429, "Too many attempts. Request a new code.");
    }

    const ok = await verifyOtp(body.code, otp.codeHash);
    if (!ok) {
      otp.attempts += 1;
      await otp.save();
      throw new ApiError(400, "Invalid OTP code");
    }

    if (body.purpose === "signup") {
      const name = otp.payload?.name;
      const passwordHash = otp.payload?.passwordHash;
      if (!name || !passwordHash) throw new ApiError(500, "Signup payload missing. Request a new code.");

      const user = await UserModel.create({ name, email, passwordHash, role: "user" });
      await otp.deleteOne();

      const token = signAccessToken({ sub: user._id.toString(), role: user.role });
      setAuthCookie(res, token);
      return res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    }

    // login
    const user = await UserModel.findOne({ email });
    if (!user) throw new ApiError(401, "Not authenticated");
    await otp.deleteOne();

    const token = signAccessToken({ sub: user._id.toString(), role: user.role });
    setAuthCookie(res, token);
    return res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/),
  password: z.string().min(8).max(200)
});

authRouter.post("/forgot-password/reset", async (req, res, next) => {
  try {
    const body = resetPasswordSchema.parse(req.body);
    const email = body.email.toLowerCase();
    const otp = await OtpModel.findOne({ email, purpose: "reset-password" });

    if (!otp) throw new ApiError(400, "OTP not found. Request a new code.");
    if (otp.expiresAt.getTime() < Date.now()) {
      await otp.deleteOne();
      throw new ApiError(400, "OTP expired. Request a new code.");
    }
    if (otp.attempts >= env.OTP_MAX_ATTEMPTS) {
      await otp.deleteOne();
      throw new ApiError(429, "Too many attempts. Request a new code.");
    }

    const ok = await verifyOtp(body.code, otp.codeHash);
    if (!ok) {
      otp.attempts += 1;
      await otp.save();
      throw new ApiError(400, "Invalid OTP code");
    }

    const user =
      (otp.payload?.userId ? await UserModel.findById(otp.payload.userId) : null) ??
      (await UserModel.findOne({ email }));

    if (!user) {
      await otp.deleteOne();
      throw new ApiError(404, "No account found for that email");
    }

    user.passwordHash = await hashPassword(body.password);
    await user.save();
    await otp.deleteOne();
    clearAuthCookie(res);

    res.json({ ok: true, message: "Password reset successfully. Please log in with your new password." });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/logout", async (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

authRouter.get("/me", async (req, res) => {
  const token = req.cookies?.[env.COOKIE_NAME];
  if (!token) return res.json({ authenticated: false });
  return res.json({ authenticated: true });
});

authRouter.get("/session", requireAuth, async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.auth!.sub).lean();
    if (!user) throw new ApiError(401, "Not authenticated");
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
});
