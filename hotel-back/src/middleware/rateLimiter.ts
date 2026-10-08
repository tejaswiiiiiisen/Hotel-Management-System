import { Request, Response, NextFunction } from "express";

/**
 * Passthrough Rate Limiter Middleware (Disabled during development)
 * Can be re-enabled in future production deployments.
 */
export const passthroughLimiter = (_req: Request, _res: Response, next: NextFunction) => {
  next();
};

export const authRateLimiter = passthroughLimiter;
export const bookingRateLimiter = passthroughLimiter;
export const chatbotRateLimiter = passthroughLimiter;
export const apiRateLimiter = passthroughLimiter;
