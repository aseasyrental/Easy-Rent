import rateLimit from 'express-rate-limit';

// Slow down credential-stuffing / brute-force against the login endpoint.
// Successful logins don't count toward the limit, so a legitimate user is never
// locked out by their own success — only repeated failures accumulate.
// NOTE: requires `app.set('trust proxy', 1)` so the client IP is read correctly
// behind Vercel's proxy (otherwise all requests would share one bucket).
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,                // 10 failed attempts per IP per window
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { message: 'Too many login attempts. Please wait 15 minutes and try again.' },
});

// Cap public rental-inquiry submissions per IP to curb spam/flooding of Bill's inbox.
export const inquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many inquiries from this connection. Please try again in a little while.' },
});
