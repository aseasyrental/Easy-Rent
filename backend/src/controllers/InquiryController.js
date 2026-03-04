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
}
