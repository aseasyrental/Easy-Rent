import { PropertyModel } from '../models/PropertyModel.js';

export class PropertyController {
  static async create(req, res, next) {
    try {
      const { title, address, price } = req.body;

      if (!title || !address || price == null) {
        return res.status(400).json({ message: 'Title, address, and price are required' });
      }

      const property = await PropertyModel.create({
        ...req.body,
        owner_id: req.user.id,
      });

      res.status(201).json(property);
    } catch (error) {
      next(error);
    }
  }
}
