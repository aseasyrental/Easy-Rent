import { DocumentModel } from '../models/DocumentModel.js';
import { PropertyModel } from '../models/PropertyModel.js';
import supabase from '../config/supabase.js';
import crypto from 'crypto';

const DOC_BUCKET = 'property-documents';
const SIGNED_URL_TTL = 60 * 60; // 1 hour

// Stored file_url may be a bare storage path (new rows) or a legacy public URL
// (old rows). Derive the object path so we can mint a fresh signed URL — the
// bucket is private, so getPublicUrl() links 403. Returns null for external URLs.
function toStoragePath(fileUrl) {
  if (!fileUrl) return null;
  if (fileUrl.includes(`${DOC_BUCKET}/`)) return fileUrl.split(`${DOC_BUCKET}/`).pop();
  if (!fileUrl.includes('://')) return fileUrl; // already a bare path
  return null; // external URL — leave as-is
}

// Swap a document's stored file_url for a fresh, time-limited signed URL so the
// private-bucket file is actually downloadable. Falls back to the stored value
// if signing isn't possible (no storage configured / external URL / sign error).
async function withSignedUrl(doc) {
  const path = toStoragePath(doc.file_url);
  if (!supabase || !path) return doc;
  const { data, error } = await supabase.storage.from(DOC_BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
  if (error || !data?.signedUrl) return doc;
  return { ...doc, file_url: data.signedUrl };
}

export class DocumentController {
  static async list(req, res, next) {
    try {
      const property = await PropertyModel.findById(req.params.id);
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }
      const documents = await DocumentModel.findByPropertyId(req.params.id);
      res.json(await Promise.all(documents.map(withSignedUrl)));
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

      // Store the storage PATH, not a URL. The bucket is private, so a public URL
      // 403s; downloads get a fresh signed URL on read (see withSignedUrl).
      const document = await DocumentModel.create({
        property_id: req.params.id,
        title,
        file_url: fileName,
        type,
      });

      res.status(201).json(await withSignedUrl(document));
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
      res.status(201).json(await withSignedUrl(document));
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

      // Try to delete from storage (path derived from the stored value)
      if (supabase) {
        const path = toStoragePath(document.file_url);
        if (path) {
          await supabase.storage.from(DOC_BUCKET).remove([path]);
        }
      }

      await DocumentModel.delete(req.params.docId);
      res.json({ message: 'Document deleted' });
    } catch (error) {
      next(error);
    }
  }
}
