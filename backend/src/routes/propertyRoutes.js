import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { PropertyController } from '../controllers/PropertyController.js';
import { authenticate, requireAdmin, requireEditor, optionalAuth } from '../middleware/index.js';
import { handleValidation } from '../middleware/validate.js';

const router = Router();

const PROPERTY_TYPES = ['apartment', 'house', 'townhouse', 'condo', 'duplex', 'basement_suite', 'laneway_house'];
const LISTING_TYPES = ['long_term', 'short_term'];

// Shared field-level validators (used by both create and update)
export const propertyFieldRules = ({ required = false } = {}) => {
  const titleRule = body('title').trim();
  const addressRule = body('address').trim();
  const priceRule = body('price');
  const bedroomsRule = body('bedrooms');
  const bathroomsRule = body('bathrooms');
  const sqftRule = body('sqft');
  const provinceRule = body('province');
  const postalCodeRule = body('postal_code');
  const statusRule = body('status');

  const rules = [];

  if (required) {
    rules.push(
      titleRule.notEmpty().withMessage('Title is required'),
      addressRule.notEmpty().withMessage('Address is required'),
      // Long-term listings need a monthly rent. Short-term (furnished) listings
      // leave `price` empty and use the daily/weekly/monthly rate fields instead.
      priceRule
        .if(body('listing_type').not().equals('short_term'))
        .isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
      // Short-term listings need at least one rate so renters see a price.
      body('listing_type')
        .if(body('listing_type').equals('short_term'))
        .custom((_value, { req }) => {
          if (!req.body.price_daily && !req.body.price_weekly && !req.body.price_monthly) {
            throw new Error('Short-term listings need at least one rate (daily, weekly, or monthly)');
          }
          return true;
        }),
    );
  } else {
    rules.push(
      titleRule.optional({ values: 'falsy' }),
      addressRule.optional({ values: 'falsy' }),
      // Price validation is listing-type aware so an edit can't silently wipe a
      // long-term rent or leave a short-term listing with no rate. Partial updates
      // that DON'T send listing_type (e.g. the status-flip from PropertyDetail)
      // skip these checks entirely — `price` stays untouched.
      body('price').custom((value, { req }) => {
        const lt = req.body.listing_type;
        const empty = value === undefined || value === null || value === '';
        if (lt === 'long_term') {
          const n = Number(value);
          if (empty || !Number.isFinite(n) || n <= 0) {
            throw new Error('Long-term listings need a monthly rent');
          }
          return true;
        }
        if (empty) return true; // optional for short-term / partial updates
        const n = Number(value);
        if (!Number.isFinite(n) || n <= 0) {
          throw new Error('Price must be a positive number');
        }
        return true;
      }),
      // Short-term saves need at least one rate so renters always see a price.
      body('listing_type')
        .if(body('listing_type').equals('short_term'))
        .custom((_value, { req }) => {
          if (!req.body.price_daily && !req.body.price_weekly && !req.body.price_monthly) {
            throw new Error('Short-term listings need at least one rate (daily, weekly, or monthly)');
          }
          return true;
        }),
    );
  }

  rules.push(
    bedroomsRule.optional({ values: 'falsy' }).isInt({ min: 0 }).withMessage('Bedrooms must be a non-negative integer'),
    bathroomsRule.optional({ values: 'falsy' }).isInt({ min: 0 }).withMessage('Bathrooms must be a non-negative integer'),
    sqftRule.optional({ values: 'falsy' }).isInt({ min: 0 }).withMessage('Sqft must be a non-negative integer'),
    provinceRule.optional({ values: 'falsy' }).isLength({ min: 2, max: 2 }).withMessage('Province must be 2 characters'),
    postalCodeRule.optional({ values: 'falsy' }).matches(/^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/).withMessage('Postal code must be valid Canadian format (e.g. V6B 1A1)'),
    statusRule.optional({ values: 'falsy' }).isIn(['available', 'occupied', 'maintenance']).withMessage('Status must be available, occupied, or maintenance'),
    body('property_type').optional({ values: 'falsy' }).isIn(PROPERTY_TYPES).withMessage(`property_type must be one of: ${PROPERTY_TYPES.join(', ')}`),
    body('listing_type').optional({ values: 'falsy' }).isIn(LISTING_TYPES).withMessage(`listing_type must be one of: ${LISTING_TYPES.join(', ')}`),
    body('is_furnished').optional().isBoolean().withMessage('is_furnished must be a boolean'),
    body('price_daily').optional({ values: 'falsy' }).isFloat({ gt: 0 }).withMessage('price_daily must be a positive number'),
    body('price_weekly').optional({ values: 'falsy' }).isFloat({ gt: 0 }).withMessage('price_weekly must be a positive number'),
    body('price_monthly').optional({ values: 'falsy' }).isFloat({ gt: 0 }).withMessage('price_monthly must be a positive number'),
    body('min_stay_nights').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('min_stay_nights must be an integer >= 1'),
  );

  return rules;
};

// Param validation for :id routes
const idParam = [
  param('id').isInt({ min: 1 }).withMessage('Property ID must be a positive integer'),
];

const SORT_OPTIONS = ['price_asc', 'price_desc', 'newest', 'availability', 'title_asc'];

router.get(
  '/',
  optionalAuth,
  [
    query('min_price').optional().isFloat({ gt: 0 }).withMessage('min_price must be a positive number'),
    query('max_price').optional().isFloat({ gt: 0 }).withMessage('max_price must be a positive number'),
    query('bedrooms').optional().isInt({ min: 0 }).withMessage('bedrooms must be a non-negative integer'),
    query('bathrooms').optional().isInt({ min: 0 }).withMessage('bathrooms must be a non-negative integer'),
    query('min_sqft').optional().isInt({ min: 0 }).withMessage('min_sqft must be a non-negative integer'),
    query('max_sqft').optional().isInt({ min: 0 }).withMessage('max_sqft must be a non-negative integer'),
    query('city').optional().trim().notEmpty().withMessage('city cannot be empty'),
    query('property_type').optional().isIn(PROPERTY_TYPES).withMessage(`property_type must be one of: ${PROPERTY_TYPES.join(', ')}`),
    query('available_by').optional().isISO8601().withMessage('available_by must be a valid date (YYYY-MM-DD)'),
    query('status').optional().isIn(['available', 'occupied', 'maintenance']).withMessage('status must be available, occupied, or maintenance'),
    query('min_lat').optional().isFloat({ min: -90, max: 90 }).withMessage('min_lat must be between -90 and 90'),
    query('max_lat').optional().isFloat({ min: -90, max: 90 }).withMessage('max_lat must be between -90 and 90'),
    query('min_lng').optional().isFloat({ min: -180, max: 180 }).withMessage('min_lng must be between -180 and 180'),
    query('max_lng').optional().isFloat({ min: -180, max: 180 }).withMessage('max_lng must be between -180 and 180'),
    query('sort').optional().isIn(SORT_OPTIONS).withMessage(`sort must be one of: ${SORT_OPTIONS.join(', ')}`),
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
    query('ids').optional().custom((value) => {
      const arr = value.split(',').map(Number);
      if (arr.some(isNaN) || arr.some(n => n < 1)) throw new Error('ids must be comma-separated positive integers');
      return true;
    }),
    query('featured').optional().isIn(['true', 'false']).withMessage('featured must be true or false'),
    query('featured_first').optional().isIn(['true', 'false']).withMessage('featured_first must be true or false'),
    query('listing_type').optional().isIn(LISTING_TYPES).withMessage(`listing_type must be one of: ${LISTING_TYPES.join(', ')}`),
  ],
  handleValidation,
  PropertyController.list,
);

router.get(
  '/:id',
  idParam,
  handleValidation,
  PropertyController.getById,
);

router.post(
  '/',
  authenticate,
  requireEditor,
  propertyFieldRules({ required: true }),
  handleValidation,
  PropertyController.create,
);

router.put(
  '/:id',
  authenticate,
  requireEditor,
  [...idParam, ...propertyFieldRules({ required: false })],
  handleValidation,
  PropertyController.update,
);

router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  idParam,
  handleValidation,
  PropertyController.delete,
);

// Admin-only: assign a property to a featured slot (1, 2, or 3) or clear it (null).
// Atomically kicks out whoever currently holds that slot.
router.patch(
  '/:id/featured',
  authenticate,
  requireAdmin,
  [
    ...idParam,
    body('position').custom((value) => {
      if (value === null) return true;
      if (!Number.isInteger(value)) throw new Error('position must be 1, 2, 3, or null');
      if (value < 1 || value > 3) throw new Error('position must be between 1 and 3');
      return true;
    }),
  ],
  handleValidation,
  PropertyController.setFeatured,
);

export default router;
