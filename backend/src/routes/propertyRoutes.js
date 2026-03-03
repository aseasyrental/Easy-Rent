import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { PropertyController } from '../controllers/PropertyController.js';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/index.js';
import { handleValidation } from '../middleware/validate.js';

const router = Router();

// Shared field-level validators (used by both create and update)
const propertyFieldRules = ({ required = false } = {}) => {
  const titleRule = body('title').trim();
  const addressRule = body('address').trim();
  const priceRule = body('price');
  const bedroomsRule = body('bedrooms');
  const bathroomsRule = body('bathrooms');
  const sqftRule = body('sqft');
  const provinceRule = body('province');
  const postalCodeRule = body('postal_code');
  const statusRule = body('status');
  const latitudeRule = body('latitude');
  const longitudeRule = body('longitude');

  const rules = [];

  if (required) {
    rules.push(
      titleRule.notEmpty().withMessage('Title is required'),
      addressRule.notEmpty().withMessage('Address is required'),
      priceRule.isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
    );
  } else {
    rules.push(
      titleRule.optional(),
      addressRule.optional(),
      priceRule.optional().isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
    );
  }

  rules.push(
    bedroomsRule.optional().isInt({ min: 0 }).withMessage('Bedrooms must be a non-negative integer'),
    bathroomsRule.optional().isInt({ min: 0 }).withMessage('Bathrooms must be a non-negative integer'),
    sqftRule.optional().isInt({ min: 0 }).withMessage('Sqft must be a non-negative integer'),
    provinceRule.optional().isLength({ min: 2, max: 2 }).withMessage('Province must be 2 characters'),
    postalCodeRule.optional().matches(/^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/).withMessage('Postal code must be valid Canadian format (e.g. V6B 1A1)'),
    statusRule.optional().isIn(['available', 'occupied', 'maintenance']).withMessage('Status must be available, occupied, or maintenance'),
    latitudeRule.optional().isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
    longitudeRule.optional().isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  );

  return rules;
};

// Param validation for :id routes
const idParam = [
  param('id').isInt({ min: 1 }).withMessage('Property ID must be a positive integer'),
];

const PROPERTY_TYPES = ['apartment', 'house', 'townhouse', 'condo', 'duplex', 'basement_suite', 'laneway_house'];
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
    query('sort').optional().isIn(SORT_OPTIONS).withMessage(`sort must be one of: ${SORT_OPTIONS.join(', ')}`),
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
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
  requireAdmin,
  propertyFieldRules({ required: true }),
  handleValidation,
  PropertyController.create,
);

router.put(
  '/:id',
  authenticate,
  requireAdmin,
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

export default router;
