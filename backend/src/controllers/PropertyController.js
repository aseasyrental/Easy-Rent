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

      const updated = await PropertyModel.update(req.params.id, req.body);
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
