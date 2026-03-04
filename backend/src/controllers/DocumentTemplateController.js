import { DocumentTemplateModel } from '../models/DocumentTemplateModel.js';

export class DocumentTemplateController {
  static async list(req, res, next) {
    try {
      const templates = await DocumentTemplateModel.findAll();
      res.json(templates);
    } catch (error) {
      next(error);
    }
  }

  static async createFromUrl(req, res, next) {
    try {
      const { title, category, file_url, file_name, file_size } = req.body;
      const template = await DocumentTemplateModel.create({
        title, category, file_url, file_name, file_size,
      });
      res.status(201).json(template);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const template = await DocumentTemplateModel.findById(req.params.id);
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }
      await DocumentTemplateModel.delete(req.params.id);
      res.json({ message: 'Template deleted' });
    } catch (error) {
      next(error);
    }
  }
}
