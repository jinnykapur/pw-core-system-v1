import type { Request, Response } from "express";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: "NotFound", message: `Route not found: ${req.method} ${req.path}` });
}

