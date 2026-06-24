import { InquiryModel } from '../models/InquiryModel.js';
import { PropertyModel } from '../models/PropertyModel.js';

export class InquiryController {
  static async create(req, res, next) {
    try {
      const { property_id, name, email, phone, message } = req.body;
      const type = req.body.type || 'question';

      // Furnished-interest inquiries are not tied to a specific listing, so
      // they skip the property-existence check. Every other inquiry type keeps
      // today's behavior exactly: property_id required and must exist.
      if (type !== 'furnished_interest') {
        const property = await PropertyModel.findById(property_id);
        if (!property) {
          return res.status(404).json({ message: 'Property not found' });
        }
      }

      const inquiry = await InquiryModel.create({ property_id, name, email, phone, message, type });
      res.status(201).json(inquiry);
    } catch (error) {
      next(error);
    }
  }

  static async list(req, res, next) {
    try {
      const filters = {
        status: req.query.status,
        property_id: req.query.property_id,
      };
      const data = await InquiryModel.findAll(filters);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const inquiry = await InquiryModel.findById(req.params.id);
      if (!inquiry) {
        return res.status(404).json({ message: 'Inquiry not found' });
      }
      res.json(inquiry);
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      const inquiry = await InquiryModel.updateStatus(req.params.id, req.body.status);
      if (!inquiry) {
        return res.status(404).json({ message: 'Inquiry not found' });
      }
      res.json(inquiry);
    } catch (error) {
      next(error);
    }
  }
}
