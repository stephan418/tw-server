import { HError } from "./http_errors";
import { Request, Response, NextFunction } from "express";

export function errorHandler(err: HError, req: Request, res: Response, next: NextFunction) {
  // Defined Server error
  if (err instanceof HError) {
    res.status(err.statusCode);
    res.json(err.response);
  } else {
    console.log("babo");
    res.status(500);
    res.json({
      type: "error",
      error: {
        type: "UNKNOWN",
        shallow: true,
      },
    });
  }
}
