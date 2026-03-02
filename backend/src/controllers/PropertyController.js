import { PropertyModel } from '../models/PropertyModel.js';

export class PropertyController {
  static async create(req, res, next) {
    try {
      const {
        title, description, address, city, province, postal_code,
        price, bedrooms, bathrooms, sqft, property_type, status,
        latitude, longitude, amenities, pet_policy,
        availability_date, lease_term_months, deposit_amount, neighborhood_info,
      } = req.body;

      const property = await PropertyModel.create({
        title, description, address, city, province, postal_code,
        price, bedrooms, bathrooms, sqft, property_type, status,
        latitude, longitude, amenities, pet_policy,
        availability_date, lease_term_months, deposit_amount, neighborhood_info,
        owner_id: req.user.id,
      });

      res.status(201).json(property);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const property = await PropertyModel.findById(req.params.id);
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }
      res.json(property);
    } catch (error) {
      next(error);
    }
  }

  static async list(req, res, next) {
    try {
      const properties = await PropertyModel.findAll();
      res.json(properties);
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const property = await PropertyModel.findById(req.params.id);
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }

      const {
        title, description, address, city, province, postal_code,
        price, bedrooms, bathrooms, sqft, property_type, status,
        latitude, longitude, amenities, pet_policy,
        availability_date, lease_term_months, deposit_amount, neighborhood_info,
      } = req.body;

      const updated = await PropertyModel.update(req.params.id, {
        title, description, address, city, province, postal_code,
        price, bedrooms, bathrooms, sqft, property_type, status,
        latitude, longitude, amenities, pet_policy,
        availability_date, lease_term_months, deposit_amount, neighborhood_info,
      });
      if (!updated) {
        return res.status(400).json({ message: 'No valid fields to update' });
      }
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const property = await PropertyModel.findById(req.params.id);
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }

      await PropertyModel.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
