import { InquiryModel } from '../models/InquiryModel.js';
import { PropertyModel } from '../models/PropertyModel.js';

export class InquiryController {
  static async create(req, res, next) {
    try {
      const { property_id, name, email, message } = req.body;

      const property = await PropertyModel.findById(property_id);
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }

      const inquiry = await InquiryModel.create({ property_id, name, email, message });
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
