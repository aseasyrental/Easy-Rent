import { PropertyModel } from '../models/PropertyModel.js';

export class PropertyController {
  static async create(req, res, next) {
    try {
      const {
        title, description, address, city, province, postal_code,
        price, bedrooms, bathrooms, sqft, property_type, status,
        latitude, longitude, amenities,
        availability_date, lease_term_months, deposit_amount, neighborhood_info,
      } = req.body;

      const property = await PropertyModel.create({
        title, description, address, city, province, postal_code,
        price, bedrooms, bathrooms, sqft, property_type, status,
        latitude, longitude, amenities,
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
      const isAdmin = req.user?.role === 'admin';

      const filters = {
        isAdmin,
        min_price: req.query.min_price,
        max_price: req.query.max_price,
        bedrooms: req.query.bedrooms,
        bathrooms: req.query.bathrooms,
        min_sqft: req.query.min_sqft,
        max_sqft: req.query.max_sqft,
        city: req.query.city,
        property_type: req.query.property_type,
        available_by: req.query.available_by,
        status: req.query.status,
        sort: req.query.sort,
        page: req.query.page,
        limit: req.query.limit,
      };

      const result = await PropertyModel.findFiltered(filters);
      res.json(result);
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
        latitude, longitude, amenities,
        availability_date, lease_term_months, deposit_amount, neighborhood_info,
      } = req.body;

      const updated = await PropertyModel.update(req.params.id, {
        title, description, address, city, province, postal_code,
        price, bedrooms, bathrooms, sqft, property_type, status,
        latitude, longitude, amenities,
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
