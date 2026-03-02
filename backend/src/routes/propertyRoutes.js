import { Router } from 'express';
import { body, param } from 'express-validator';
import { PropertyController } from '../controllers/PropertyController.js';
import { authenticate, requireAdmin } from '../middleware/index.js';
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

router.get('/', PropertyController.list);

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
