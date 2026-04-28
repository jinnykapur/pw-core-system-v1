import bcrypt from "bcrypt";

export function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

export async function hashOtp(code: string) {
  return bcrypt.hash(code, 12);
}

export async function verifyOtp(code: string, codeHash: string) {
  return bcrypt.compare(code, codeHash);
}

