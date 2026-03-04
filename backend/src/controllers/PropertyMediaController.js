import { PropertyMediaModel } from '../models/PropertyMediaModel.js';
import { PropertyModel } from '../models/PropertyModel.js';
import supabase from '../config/supabase.js';
import crypto from 'crypto';

export class PropertyMediaController {
  static async list(req, res, next) {
    try {
      const property = await PropertyModel.findById(req.params.id);
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }
      const images = await PropertyMediaModel.findByPropertyId(req.params.id);
      res.json(images);
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

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ message: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' });
      }

      if (!supabase) {
        return res.status(503).json({ message: 'Storage not configured' });
      }

      const ext = req.file.originalname.split('.').pop();
      const fileName = `${req.params.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
        });

      if (uploadError) {
        return res.status(500).json({ message: 'Upload failed', error: uploadError.message });
      }

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);

      const isPrimary = req.body.is_primary === 'true';
      const sortOrder = parseInt(req.body.sort_order) || 0;

      if (isPrimary) {
        await PropertyMediaModel.setPrimary(req.params.id, null);
      }

      const media = await PropertyMediaModel.create({
        property_id: req.params.id,
        type: 'photo',
        url: publicUrl,
        sort_order: sortOrder,
        is_primary: isPrimary,
      });

      res.status(201).json(media);
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

      const { url, is_primary, sort_order } = req.body;

      if (is_primary) {
        await PropertyMediaModel.setPrimary(req.params.id, null);
      }

      const media = await PropertyMediaModel.create({
        property_id: req.params.id,
        type: 'photo',
        url,
        sort_order: sort_order || 0,
        is_primary: is_primary || false,
      });

      res.status(201).json(media);
    } catch (error) {
      next(error);
    }
  }

  static async setPrimary(req, res, next) {
    try {
      const media = await PropertyMediaModel.findById(req.params.imageId);
      if (!media || media.property_id !== parseInt(req.params.id)) {
        return res.status(404).json({ message: 'Image not found' });
      }
      await PropertyMediaModel.setPrimary(req.params.id, req.params.imageId);
      res.json({ message: 'Primary image updated' });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const media = await PropertyMediaModel.findById(req.params.imageId);
      if (!media || media.property_id !== parseInt(req.params.id)) {
        return res.status(404).json({ message: 'Image not found' });
      }

      // Try to delete from storage (extract path from URL)
      if (supabase && media.url.includes('property-images')) {
        const path = media.url.split('property-images/').pop();
        if (path) {
          await supabase.storage.from('property-images').remove([path]);
        }
      }

      await PropertyMediaModel.delete(req.params.imageId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
