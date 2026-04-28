import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "ValidationError",
      message: "Invalid request",
      issues: err.issues
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: "ApiError",
      message: err.message,
      details: err.details ?? null
    });
  }

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "UploadError",
        message: "Resume file is too large. Please upload a PDF up to 2MB."
      });
    }
    return res.status(400).json({
      error: "UploadError",
      message: err.message
    });
  }

  // eslint-disable-next-line no-console
  console.error("[backend] unhandled error", err);
  return res.status(500).json({ error: "InternalServerError", message: "Something went wrong" });
}
