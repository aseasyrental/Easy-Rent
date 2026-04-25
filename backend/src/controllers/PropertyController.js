import { PropertyModel } from '../models/PropertyModel.js';
import { PropertyMediaModel } from '../models/PropertyMediaModel.js';
import { geocodeAddress } from '../services/geocoder.js';

export class PropertyController {
  static async create(req, res, next) {
    try {
      const {
        title, description, address, city, province, postal_code,
        price, bedrooms, bathrooms, sqft, property_type, status,
        amenities,
        availability_date, lease_term_months, deposit_amount, neighborhood_info,
      } = req.body;

      const coords = await geocodeAddress(address, city, province);

      const property = await PropertyModel.create({
        title, description, address, city, province, postal_code,
        price, bedrooms, bathrooms, sqft, property_type, status,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        amenities,
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
      const images = await PropertyMediaModel.findByPropertyId(req.params.id);
      res.json({ ...property, images });
    } catch (error) {
      next(error);
    }
  }

  static async list(req, res, next) {
    try {
      const isAdmin = req.user?.role === 'admin';

      const filters = {
        isAdmin,
        ids: req.query.ids,
        min_price: req.query.min_price,
        max_price: req.query.max_price,
        bedrooms: req.query.bedrooms,
        bathrooms: req.query.bathrooms,
        min_sqft: req.query.min_sqft,
        max_sqft: req.query.max_sqft,
        city: req.query.city || req.query.location,
        property_type: req.query.property_type,
        available_by: req.query.available_by,
        status: req.query.status,
        min_lat: req.query.min_lat,
        max_lat: req.query.max_lat,
        min_lng: req.query.min_lng,
        max_lng: req.query.max_lng,
        sort: req.query.sort,
        page: req.query.page,
        limit: req.query.limit,
        featured: req.query.featured === 'true' || req.query.featured === true,
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
        amenities,
        availability_date, lease_term_months, deposit_amount, neighborhood_info,
      } = req.body;

      let coords = null;
      if (address || city || province || postal_code) {
        const addrForGeocode = address || property.address;
        const cityForGeocode = city || property.city;
        const provForGeocode = province || property.province;
        coords = await geocodeAddress(addrForGeocode, cityForGeocode, provForGeocode);
      }

      const updated = await PropertyModel.update(req.params.id, {
        title, description, address, city, province, postal_code,
        price, bedrooms, bathrooms, sqft, property_type, status,
        latitude: coords?.latitude ?? undefined,
        longitude: coords?.longitude ?? undefined,
        amenities,
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

  static async setFeatured(req, res, next) {
    try {
      const { position } = req.body;
      const updated = await PropertyModel.setFeaturedPosition(req.params.id, position);
      if (!updated) {
        return res.status(404).json({ message: 'Property not found' });
      }
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
}
