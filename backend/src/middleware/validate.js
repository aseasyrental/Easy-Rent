import { validationResult } from 'express-validator';

/**
 * Middleware that checks express-validator results and returns 400
 * with an array of error messages if any validations failed.
 *
 * Usage: router.post('/foo', [...rules], handleValidation, controller);
 */
export function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(e => e.msg),
    });
  }
  next();
}
