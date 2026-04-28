import jwt, { type Secret } from "jsonwebtoken";
import { env } from "../config/env";
import type { JwtPayload } from "../middleware/auth";

export function signAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET as Secret, { expiresIn: env.JWT_ACCESS_EXPIRES_IN as any });
}

