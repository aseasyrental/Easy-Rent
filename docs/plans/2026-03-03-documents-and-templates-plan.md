# Documents & Templates Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add global document templates, per-property document uploads, and rename "Price" to "Rent" across admin + public sites.

**Architecture:** Two new Supabase Storage buckets (`document-templates`, `property-documents`), one new DB table (`document_templates`), one altered DB table (`documents` — expand type CHECK), new backend models/controllers/routes following existing PropertyMedia pattern, two new admin UI components (TemplatesPanel, DocumentUploader), rent label rename across 6 files.

**Tech Stack:** React, Express, pg-promise, Supabase Storage, express-validator

---

### Task 1: Rename "Price" to "Rent" labels

**Files:**
- Modify: `admin-dashboard/src/components/PropertyForm.jsx:285-288` (label + guidance text)
- Modify: `admin-dashboard/src/components/PropertyDetail.jsx:216` (field label)
- Modify: `public-site/src/components/FilterBar.jsx:87,98` (filter labels)
- Modify: `public-site/src/components/PropertyPanel.jsx:48` (no label text change needed, just shows `$X/mo`)

**Step 1: Update admin PropertyForm**

In `PropertyForm.jsx`:
- Line 169: Change `"Start with the basics — address, price, and a few photos."` → `"Start with the basics — address, rent, and a few photos."`
- Line 285: Change `{/* Price */}` → `{/* Rent */}`
- Line 288: Change `Price ($/mo)` → `Rent ($/mo)`

**Step 2: Update admin PropertyDetail**

In `PropertyDetail.jsx`:
- Line 216: Change `<span className="prop-detail__field-label">Price</span>` → `<span className="prop-detail__field-label">Rent</span>`

**Step 3: Update public site FilterBar**

In `FilterBar.jsx`:
- Line 87: Change `Min Price` → `Min Rent`
- Line 98: Change `Max Price` → `Max Rent`

**Step 4: Verify both builds pass**

Run: `cd admin-dashboard && npm run build && cd ../public-site && npm run build`
Expected: Both succeed

**Step 5: Commit**

```bash
git add admin-dashboard/src/components/PropertyForm.jsx admin-dashboard/src/components/PropertyDetail.jsx public-site/src/components/FilterBar.jsx
git commit -m "feat: rename Price to Rent across admin and public UI"
```

---

### Task 2: Update constants + DB schema for document types

**Files:**
- Modify: `shared/constants.js:37-41`
- Create: `backend/src/db/migrations/015_update_document_types.sql`
- Create: `backend/src/db/migrations/016_create_document_templates.sql`

**Step 1: Update shared constants**

In `shared/constants.js`, replace DOCUMENT_TYPES (lines 37-41):

```javascript
export const DOCUMENT_TYPES = {
  FORM: 'form',
  AGREEMENT: 'agreement',
  LEASE: 'lease',
  INSPECTION: 'inspection',
  NOTICE: 'notice',
};
```

**Step 2: Create migration 015 — update documents CHECK constraint**

Create `backend/src/db/migrations/015_update_document_types.sql`:

```sql
-- Expand document type CHECK to include inspection and notice
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_type_check;
ALTER TABLE documents ADD CONSTRAINT documents_type_check
  CHECK (type IN ('form', 'agreement', 'lease', 'inspection', 'notice'));
```

**Step 3: Create migration 016 — create document_templates table**

Create `backend/src/db/migrations/016_create_document_templates.sql`:

```sql
CREATE TABLE IF NOT EXISTS document_templates (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('lease', 'agreement', 'form', 'inspection', 'notice')),
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Step 4: Run migrations**

Run: `cd backend && npm run migrate`
Expected: Both 015 and 016 applied successfully

**Step 5: Commit**

```bash
git add shared/constants.js backend/src/db/migrations/015_update_document_types.sql backend/src/db/migrations/016_create_document_templates.sql
git commit -m "feat: add document types (inspection, notice) and document_templates table"
```

---

### Task 3: Create Supabase Storage buckets + RLS policies

**Step 1: Create buckets and policies**

Run this via a node script from `backend/`:

```bash
cd backend && node -e "
import db from './src/config/database.js';

// Create buckets
await db.none(\`INSERT INTO storage.buckets (id, name, public) VALUES ('document-templates', 'document-templates', true) ON CONFLICT DO NOTHING\`);
await db.none(\`INSERT INTO storage.buckets (id, name, public) VALUES ('property-documents', 'property-documents', true) ON CONFLICT DO NOTHING\`);

// RLS policies for document-templates
await db.none(\`CREATE POLICY \"Public read document-templates\" ON storage.objects FOR SELECT TO public USING (bucket_id = 'document-templates')\`);
await db.none(\`CREATE POLICY \"Anon upload document-templates\" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'document-templates')\`);
await db.none(\`CREATE POLICY \"Anon delete document-templates\" ON storage.objects FOR DELETE TO anon USING (bucket_id = 'document-templates')\`);

// RLS policies for property-documents
await db.none(\`CREATE POLICY \"Public read property-documents\" ON storage.objects FOR SELECT TO public USING (bucket_id = 'property-documents')\`);
await db.none(\`CREATE POLICY \"Anon upload property-documents\" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'property-documents')\`);
await db.none(\`CREATE POLICY \"Anon delete property-documents\" ON storage.objects FOR DELETE TO anon USING (bucket_id = 'property-documents')\`);

console.log('Buckets and policies created');
process.exit(0);
"
```

**Step 2: Verify buckets exist**

```bash
cd backend && node -e "
import db from './src/config/database.js';
const buckets = await db.any('SELECT id, name, public FROM storage.buckets');
console.log(buckets);
process.exit(0);
"
```

Expected: See `document-templates` and `property-documents` in output

**Step 3: Commit** (no files changed — infrastructure only, note in commit)

```bash
git commit --allow-empty -m "infra: create Supabase storage buckets for documents and templates"
```

---

### Task 4: Backend — DocumentTemplate model, controller, routes

**Files:**
- Create: `backend/src/models/DocumentTemplateModel.js`
- Create: `backend/src/controllers/DocumentTemplateController.js`
- Create: `backend/src/routes/documentTemplateRoutes.js`
- Modify: `backend/src/app.js` (mount routes)

**Step 1: Create DocumentTemplateModel**

Create `backend/src/models/DocumentTemplateModel.js`:

```javascript
import db from '../config/database.js';

export class DocumentTemplateModel {
  static async create({ title, category, file_url, file_name, file_size }) {
    return db.one(
      `INSERT INTO document_templates (title, category, file_url, file_name, file_size)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, category, file_url, file_name, file_size]
    );
  }

  static async findAll() {
    return db.any('SELECT * FROM document_templates ORDER BY created_at DESC');
  }

  static async findById(id) {
    return db.oneOrNone('SELECT * FROM document_templates WHERE id = $1', [id]);
  }

  static async delete(id) {
    const result = await db.result('DELETE FROM document_templates WHERE id = $1', [id]);
    return result.rowCount;
  }
}
```

**Step 2: Create DocumentTemplateController**

Create `backend/src/controllers/DocumentTemplateController.js`:

```javascript
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
```

**Step 3: Create documentTemplateRoutes**

Create `backend/src/routes/documentTemplateRoutes.js`:

```javascript
import { Router } from 'express';
import { body, param } from 'express-validator';
import { DocumentTemplateController } from '../controllers/DocumentTemplateController.js';
import { authenticate, requireAdmin } from '../middleware/index.js';
import { handleValidation } from '../middleware/validate.js';

const router = Router();

const CATEGORIES = ['lease', 'agreement', 'form', 'inspection', 'notice'];

router.get('/', authenticate, requireAdmin, DocumentTemplateController.list);

router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('category').isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),
    body('file_url').isURL().withMessage('Valid file URL is required'),
    body('file_name').trim().notEmpty().withMessage('File name is required'),
    body('file_size').optional({ values: 'falsy' }).isInt({ min: 0 }).withMessage('File size must be a non-negative integer'),
  ],
  handleValidation,
  DocumentTemplateController.createFromUrl,
);

router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  [param('id').isInt({ min: 1 }).withMessage('Template ID must be a positive integer')],
  handleValidation,
  DocumentTemplateController.delete,
);

export default router;
```

**Step 4: Mount routes in app.js**

In `backend/src/app.js`, add import and mount:
- Add import: `import documentTemplateRoutes from './routes/documentTemplateRoutes.js';`
- Add mount after line 41: `app.use('/api/templates', documentTemplateRoutes);`

**Step 5: Verify backend starts**

Run: `cd backend && node -e "import('./src/app.js').then(() => console.log('OK'))"`

**Step 6: Commit**

```bash
git add backend/src/models/DocumentTemplateModel.js backend/src/controllers/DocumentTemplateController.js backend/src/routes/documentTemplateRoutes.js backend/src/app.js
git commit -m "feat: add document templates API (model, controller, routes)"
```

---

### Task 5: Backend — PropertyDocument model, controller, routes

**Files:**
- Create: `backend/src/models/DocumentModel.js`
- Create: `backend/src/controllers/DocumentController.js`
- Create: `backend/src/routes/documentRoutes.js`
- Modify: `backend/src/app.js` (mount routes)

**Step 1: Create DocumentModel**

Create `backend/src/models/DocumentModel.js`:

```javascript
import db from '../config/database.js';

export class DocumentModel {
  static async create({ property_id, title, file_url, type }) {
    return db.one(
      `INSERT INTO documents (property_id, title, file_url, type)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [property_id, title, file_url, type]
    );
  }

  static async findByPropertyId(propertyId) {
    return db.any(
      'SELECT * FROM documents WHERE property_id = $1 ORDER BY created_at DESC',
      [propertyId]
    );
  }

  static async findById(id) {
    return db.oneOrNone('SELECT * FROM documents WHERE id = $1', [id]);
  }

  static async delete(id) {
    const result = await db.result('DELETE FROM documents WHERE id = $1', [id]);
    return result.rowCount;
  }
}
```

**Step 2: Create DocumentController**

Create `backend/src/controllers/DocumentController.js`:

```javascript
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
```

**Step 3: Create documentRoutes**

Create `backend/src/routes/documentRoutes.js`:

```javascript
import { Router } from 'express';
import { body, param } from 'express-validator';
import { DocumentController } from '../controllers/DocumentController.js';
import { authenticate, requireAdmin } from '../middleware/index.js';
import { handleValidation } from '../middleware/validate.js';

const router = Router({ mergeParams: true });

const DOC_TYPES = ['lease', 'agreement', 'form', 'inspection', 'notice'];

const idParam = [
  param('id').isInt({ min: 1 }).withMessage('Property ID must be a positive integer'),
];

const docIdParam = [
  param('docId').isInt({ min: 1 }).withMessage('Document ID must be a positive integer'),
];

router.get('/', authenticate, requireAdmin, idParam, handleValidation, DocumentController.list);

router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    ...idParam,
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('type').isIn(DOC_TYPES).withMessage(`Type must be one of: ${DOC_TYPES.join(', ')}`),
    body('file_url').isURL().withMessage('Valid file URL is required'),
  ],
  handleValidation,
  DocumentController.createFromUrl,
);

router.delete(
  '/:docId',
  authenticate,
  requireAdmin,
  [...idParam, ...docIdParam],
  handleValidation,
  DocumentController.delete,
);

export default router;
```

**Step 4: Mount routes in app.js**

In `backend/src/app.js`:
- Add import: `import documentRoutes from './routes/documentRoutes.js';`
- Add mount: `app.use('/api/properties/:id/documents', documentRoutes);`

**Step 5: Verify backend starts**

Run: `cd backend && node -e "import('./src/app.js').then(() => console.log('OK'))"`

**Step 6: Commit**

```bash
git add backend/src/models/DocumentModel.js backend/src/controllers/DocumentController.js backend/src/routes/documentRoutes.js backend/src/app.js
git commit -m "feat: add per-property documents API (model, controller, routes)"
```

---

### Task 6: Admin UI — DocumentUploader component (per-property)

**Files:**
- Create: `admin-dashboard/src/components/DocumentUploader.jsx`
- Create: `admin-dashboard/src/components/DocumentUploader.css`
- Modify: `admin-dashboard/src/components/PropertyDetail.jsx` (add DocumentUploader section after amenities)

**Step 1: Create DocumentUploader component**

Create `admin-dashboard/src/components/DocumentUploader.jsx`. Follow ImageUploader pattern but for documents:

```jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import supabase from '../config/supabase.js';
import apiClient from '../services/api.js';
import './DocumentUploader.css';

const BUCKET = 'property-documents';
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DOC_TYPES = ['lease', 'agreement', 'form', 'inspection', 'notice'];

export default function DocumentUploader({ propertyId }) {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('form');
  const fileInputRef = useRef(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await apiClient.get(`/properties/${propertyId}/documents`);
      setDocuments(res.data);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    }
  }, [propertyId]);

  useEffect(() => {
    if (propertyId) fetchDocuments();
  }, [propertyId, fetchDocuments]);

  const uploadFile = useCallback(async (file) => {
    if (!supabase) return;
    if (file.size > MAX_SIZE) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a document title before uploading.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const ext = file.name.split('.').pop();
      const path = `${propertyId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path);

      await apiClient.post(`/properties/${propertyId}/documents`, {
        title: title.trim(),
        type: docType,
        file_url: publicUrl,
      });

      setTitle('');
      setDocType('form');
      await fetchDocuments();
    } catch (err) {
      console.error('Document upload failed:', err);
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [propertyId, title, docType, fetchDocuments]);

  const handleDelete = useCallback(async (docId) => {
    try {
      await apiClient.delete(`/properties/${propertyId}/documents/${docId}`);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  }, [propertyId]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  }, [uploadFile]);

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="doc-uploader">
      <h3 className="doc-uploader__title">Documents</h3>

      {/* Upload fields */}
      <div className="doc-uploader__fields">
        <input
          className="doc-uploader__input"
          type="text"
          placeholder="Document title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <select
          className="doc-uploader__select"
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
        >
          {DOC_TYPES.map((t) => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Dropzone */}
      <div
        className={`doc-uploader__dropzone ${dragActive ? 'doc-uploader__dropzone--active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          hidden
          onChange={handleFileSelect}
        />
        {uploading ? 'Uploading...' : 'Drag a file here or click to browse'}
      </div>

      {error && <div className="doc-uploader__error">{error}</div>}

      {/* Document list */}
      {documents.length > 0 && (
        <div className="doc-uploader__list">
          {documents.map((doc) => (
            <div key={doc.id} className="doc-uploader__item">
              <div className="doc-uploader__item-info">
                <span className="doc-uploader__item-title">{doc.title}</span>
                <span className="doc-uploader__item-type">{doc.type}</span>
              </div>
              <div className="doc-uploader__item-actions">
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="doc-uploader__btn doc-uploader__btn--download"
                >
                  Download
                </a>
                <button
                  className="doc-uploader__btn doc-uploader__btn--delete"
                  onClick={() => handleDelete(doc.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Create DocumentUploader.css**

Create `admin-dashboard/src/components/DocumentUploader.css` — follow the glass morphism style of ImageUploader. Key classes: `.doc-uploader`, `.doc-uploader__title`, `.doc-uploader__fields`, `.doc-uploader__dropzone`, `.doc-uploader__error`, `.doc-uploader__list`, `.doc-uploader__item`, `.doc-uploader__btn`. Match existing form input styling from `PropertyForm.css` (`.prop-form__input`, `.prop-form__select`).

**Step 3: Add DocumentUploader to PropertyDetail**

In `admin-dashboard/src/components/PropertyDetail.jsx`:
- Add import: `import DocumentUploader from './DocumentUploader.jsx';`
- After the amenities section (line 287) and before the actions section (line 289), add:

```jsx
      {/* Documents */}
      <DocumentUploader propertyId={detail.id} />
```

**Step 4: Verify build**

Run: `cd admin-dashboard && npm run build`
Expected: Success

**Step 5: Commit**

```bash
git add admin-dashboard/src/components/DocumentUploader.jsx admin-dashboard/src/components/DocumentUploader.css admin-dashboard/src/components/PropertyDetail.jsx
git commit -m "feat: add DocumentUploader component to property detail view"
```

---

### Task 7: Admin UI — Templates panel

**Files:**
- Create: `admin-dashboard/src/components/TemplatesSidePanel.jsx`
- Create: `admin-dashboard/src/components/TemplatesSidePanel.css`
- Modify: `admin-dashboard/src/components/Shell.jsx` (add nav item)
- Modify: `admin-dashboard/src/components/SidePanel.jsx` (render TemplatesSidePanel)

**Step 1: Create TemplatesSidePanel**

Create `admin-dashboard/src/components/TemplatesSidePanel.jsx` — a self-contained panel with upload form + list. Follows the same architecture as `PropertiesSidePanel` (standalone panel rendered inside SidePanel):

```jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import supabase from '../config/supabase.js';
import apiClient from '../services/api.js';
import './TemplatesSidePanel.css';

const BUCKET = 'document-templates';
const MAX_SIZE = 10 * 1024 * 1024;
const CATEGORIES = ['lease', 'agreement', 'form', 'inspection', 'notice'];

export default function TemplatesSidePanel() {
  const [templates, setTemplates] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('form');
  const fileInputRef = useRef(null);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await apiClient.get('/templates');
      setTemplates(res.data);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const uploadFile = useCallback(async (file) => {
    if (!supabase) return;
    if (file.size > MAX_SIZE) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a title before uploading.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const ext = file.name.split('.').pop();
      const path = `${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path);

      await apiClient.post('/templates', {
        title: title.trim(),
        category,
        file_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
      });

      setTitle('');
      setCategory('form');
      await fetchTemplates();
    } catch (err) {
      console.error('Template upload failed:', err);
      setError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }, [title, category, fetchTemplates]);

  const handleDelete = useCallback(async (id) => {
    try {
      await apiClient.delete(`/templates/${id}`);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Failed to delete template:', err);
    }
  }, []);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  }, [uploadFile]);

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="templates-panel">
      {/* Upload form */}
      <div className="templates-panel__upload">
        <input
          className="templates-panel__input"
          type="text"
          placeholder="Template title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <select
          className="templates-panel__select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
        <button
          className="templates-panel__upload-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
        <input ref={fileInputRef} type="file" hidden onChange={handleFileSelect} />
      </div>

      {error && <div className="templates-panel__error">{error}</div>}

      {/* Template list */}
      <div className="templates-panel__list">
        {templates.length === 0 ? (
          <p className="templates-panel__empty">No templates yet. Upload one above.</p>
        ) : (
          templates.map((t) => (
            <div key={t.id} className="templates-panel__item">
              <div className="templates-panel__item-info">
                <span className="templates-panel__item-title">{t.title}</span>
                <span className="templates-panel__item-meta">
                  {t.category} {t.file_size ? `· ${formatSize(t.file_size)}` : ''}
                </span>
              </div>
              <div className="templates-panel__item-actions">
                <a
                  href={t.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="templates-panel__btn templates-panel__btn--download"
                >
                  Download
                </a>
                <button
                  className="templates-panel__btn templates-panel__btn--delete"
                  onClick={() => handleDelete(t.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

**Step 2: Create TemplatesSidePanel.css**

Create `admin-dashboard/src/components/TemplatesSidePanel.css` — match existing SidePanel glass styling. Key classes: `.templates-panel`, `.templates-panel__upload`, `.templates-panel__input`, `.templates-panel__select`, `.templates-panel__upload-btn`, `.templates-panel__error`, `.templates-panel__list`, `.templates-panel__item`, `.templates-panel__btn`.

**Step 3: Add Templates nav item to Shell.jsx**

In `admin-dashboard/src/components/Shell.jsx`, add to `navItems` array (find an empty bookshelf rect — use a spot near the existing items):

```javascript
  {
    path: '/templates', label: 'Templates',
    rect: { x1: 0.631, y1: 0.342, x2: 0.822, y2: 0.421 },
  },
```

Note: The exact rect coordinates depend on the background image layout. Pick a spot that doesn't overlap existing nav boxes — the area to the right of "Leads" on the same shelf row is a good candidate. Verify visually after implementation.

**Step 4: Wire up SidePanel to render TemplatesSidePanel**

In `admin-dashboard/src/components/SidePanel.jsx`:
- Add import: `import TemplatesSidePanel from './TemplatesSidePanel';`
- After `const isMessages = activeSection === '/messages';` add: `const isTemplates = activeSection === '/templates';`
- In the JSX, add a branch for templates (after the isMessages check):

```jsx
      ) : isTemplates ? (
        <TemplatesSidePanel />
```

**Step 5: Verify build**

Run: `cd admin-dashboard && npm run build`
Expected: Success

**Step 6: Commit**

```bash
git add admin-dashboard/src/components/TemplatesSidePanel.jsx admin-dashboard/src/components/TemplatesSidePanel.css admin-dashboard/src/components/Shell.jsx admin-dashboard/src/components/SidePanel.jsx
git commit -m "feat: add Templates nav item and TemplatesSidePanel to admin dashboard"
```

---

### Task 8: Deploy and verify

**Step 1: Deploy admin dashboard**

```bash
cd admin-dashboard && vercel --prod
```

**Step 2: Deploy public site (from repo root)**

```bash
cd /c/Users/mrjos/Projects/Easy-Rent && vercel --prod
```

**Step 3: Verify**

- Visit `admin.easy-rental.ca` — check Templates nav, property documents section
- Visit `easy-rental.ca` — check "Rent" labels on cards and filters
- Test template upload/download/delete
- Test property document upload/download/delete

**Step 4: Final commit (map update)**

```bash
git add EASY-RENTAL-MAP.md
git commit -m "docs: update map with session 22 — documents, templates, rent labels"
```
