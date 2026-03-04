import { DocumentModel } from '../models/DocumentModel.js';
import { PropertyModel } from '../models/PropertyModel.js';

export class DocumentController {
  static async list(req, res, next) {
    try {
      const property = await PropertyModel.findById(req.params.id);
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }
      const documents = await DocumentModel.findByPropertyId(req.params.id);
      res.json(documents);
    } catch (error) {
      next(error);
    }
  }

  static async createFromUrl(req, res, next) {
    try {
      const property = await PropertyModel.findById(req.params.id);
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }
      const { title, file_url, type } = req.body;
      const document = await DocumentModel.create({
        property_id: req.params.id,
        title, file_url, type,
      });
      res.status(201).json(document);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const document = await DocumentModel.findById(req.params.docId);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      await DocumentModel.delete(req.params.docId);
      res.json({ message: 'Document deleted' });
    } catch (error) {
      next(error);
    }
  }
}
