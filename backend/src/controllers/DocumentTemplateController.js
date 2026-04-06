import { DocumentTemplateModel } from '../models/DocumentTemplateModel.js';
import supabase from '../config/supabase.js';
import crypto from 'crypto';

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

  static async upload(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file provided' });
      }

      const CATEGORIES = ['lease', 'agreement', 'form', 'inspection', 'notice'];
      const title = req.body.title?.trim();
      const category = req.body.category;

      if (!title) {
        return res.status(400).json({ message: 'Title is required' });
      }
      if (!CATEGORIES.includes(category)) {
        return res.status(400).json({ message: `Category must be one of: ${CATEGORIES.join(', ')}` });
      }

      if (!supabase) {
        return res.status(503).json({ message: 'Storage not configured' });
      }

      const ext = req.file.originalname.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('document-templates')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
        });

      if (uploadError) {
        return res.status(500).json({ message: 'Upload failed', error: uploadError.message });
      }

      const { data: { publicUrl } } = supabase.storage
        .from('document-templates')
        .getPublicUrl(fileName);

      const template = await DocumentTemplateModel.create({
        title,
        category,
        file_url: publicUrl,
        file_name: req.file.originalname,
        file_size: req.file.size,
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

      // Try to delete from storage (extract path from URL)
      if (supabase && template.file_url.includes('document-templates')) {
        const path = template.file_url.split('document-templates/').pop();
        if (path) {
          await supabase.storage.from('document-templates').remove([path]);
        }
      }

      await DocumentTemplateModel.delete(req.params.id);
      res.json({ message: 'Template deleted' });
    } catch (error) {
      next(error);
    }
  }
}
