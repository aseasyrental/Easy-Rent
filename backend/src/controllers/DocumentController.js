import { DocumentModel } from '../models/DocumentModel.js';
import { PropertyModel } from '../models/PropertyModel.js';
import supabase from '../config/supabase.js';
import crypto from 'crypto';

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

  static async upload(req, res, next) {
    try {
      const property = await PropertyModel.findById(req.params.id);
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file provided' });
      }

      const DOC_TYPES = ['lease', 'agreement', 'form', 'inspection', 'notice'];
      const title = req.body.title?.trim();
      const type = req.body.type;

      if (!title) {
        return res.status(400).json({ message: 'Title is required' });
      }
      if (!DOC_TYPES.includes(type)) {
        return res.status(400).json({ message: `Type must be one of: ${DOC_TYPES.join(', ')}` });
      }

      if (!supabase) {
        return res.status(503).json({ message: 'Storage not configured' });
      }

      const ext = req.file.originalname.split('.').pop();
      const fileName = `${req.params.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('property-documents')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
        });

      if (uploadError) {
        return res.status(500).json({ message: 'Upload failed', error: uploadError.message });
      }

      const { data: { publicUrl } } = supabase.storage
        .from('property-documents')
        .getPublicUrl(fileName);

      const document = await DocumentModel.create({
        property_id: req.params.id,
        title,
        file_url: publicUrl,
        type,
      });

      res.status(201).json(document);
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
      if (!document || document.property_id !== parseInt(req.params.id)) {
        return res.status(404).json({ message: 'Document not found' });
      }

      // Try to delete from storage (extract path from URL)
      if (supabase && document.file_url.includes('property-documents')) {
        const path = document.file_url.split('property-documents/').pop();
        if (path) {
          await supabase.storage.from('property-documents').remove([path]);
        }
      }

      await DocumentModel.delete(req.params.docId);
      res.json({ message: 'Document deleted' });
    } catch (error) {
      next(error);
    }
  }
}
