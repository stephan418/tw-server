import express from 'express';

// This handler catches errors thrown in async request handlers using Promise.catch() and passes them to next()
export function asyncHandler(f: (req: express.Request, res: express.Response, next?: express.NextFunction) => any): any {
  return function (req: any, res: any, next: express.NextFunction) {
    return f(req, res, next).catch((e: any) => next(e));
  };
}