# Backend Uploads — Remove Supabase from Admin Dashboard

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move all file uploads from client-side Supabase (anon key) to server-side Express endpoints (service_role key), then remove Supabase from the admin dashboard entirely.

**Architecture:** The admin dashboard currently uploads files directly to Supabase Storage using the anon key, then registers the URL with the backend. This is broken (pointing at a deleted Supabase project) and insecure (exposes the anon key in the JS bundle). The fix: add multer upload endpoints to the backend (following the existing image upload pattern), switch the three frontend uploaders to POST FormData to the backend, and remove the Supabase client from the admin dashboard.

**Tech Stack:** Express + multer (backend), React + axios (frontend), Supabase Storage via service_role (backend only)

**Context:** The backend already has a working image upload endpoint (`POST /api/properties/:id/images`) that uses multer + Supabase service_role. Documents and templates only have `createFromUrl` endpoints. The three frontend components that use Supabase are `ImageUploader.jsx`, `DocumentUploader.jsx`, and `TemplatesSidePanel.jsx` — all for storage uploads only.

---

### Prerequisite: Backend Supabase env vars

The backend needs `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to upload files. These are NOT currently set on Josh's Vercel project (where the site lives).

**Josh must manually add these in the Vercel dashboard** (API can't set them — scope limitation):

- `SUPABASE_URL` = `https://qedlpnkbjgvgibhufpiq.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = the service_role key from Bill's Supabase (check `memory/reference_accounts_and_repos.md` line 98)
- Environment: **Production**
- Project: The `easy-rental` project on `joshs-projects-d90177c0` (the one serving `easy-rental.ca`)

**Do not proceed with deployment until these are set and a redeploy confirms the backend can reach Supabase.**

**Storage buckets:** All three buckets already exist on Bill's Supabase (verified 2026-04-01): `property-images` (public), `document-templates` (public), `property-documents` (private). No creation needed.

**Note on Content-Type:** When POSTing FormData via axios, do NOT explicitly set `Content-Type: multipart/form-data`. Axios detects FormData and sets the header automatically with the required `boundary` parameter. Explicitly setting it omits the boundary, which causes multer to silently fail to parse the file.

---

### Task 1: Backend — Add document upload endpoint

**Files:**
- Modify: `backend/src/controllers/DocumentController.js`
- Modify: `backend/src/routes/documentRoutes.js`

- [ ] **Step 1: Add upload method to DocumentController**

Add `upload` static method to `DocumentController` in `backend/src/controllers/DocumentController.js`, following the exact pattern from `PropertyMediaController.upload`:

```javascript
import supabase from '../config/supabase.js';
import crypto from 'crypto';

// Inside the class, after createFromUrl:

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
```

Also update the `delete` method to clean up storage:

```javascript
static async delete(req, res, next) {
  try {
    const document = await DocumentModel.findById(req.params.docId);
    if (!document || document.property_id !== parseInt(req.params.id)) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Clean up storage if possible
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
```

Don't forget to add the imports at the top: `import supabase from '../config/supabase.js';` and `import crypto from 'crypto';`

- [ ] **Step 2: Add upload route to documentRoutes.js**

In `backend/src/routes/documentRoutes.js`, add multer and the upload route:

```javascript
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const DOC_TYPES = ['lease', 'agreement', 'form', 'inspection', 'notice'];
```

Add this route BEFORE the existing `router.post('/', ...)`:

```javascript
router.post(
  '/upload',
  authenticate,
  requireAdmin,
  idParam,
  handleValidation,
  upload.single('file'),
  DocumentController.upload,
);
```

The `/upload` path avoids conflicting with the existing `POST /` (createFromUrl). Keep the old route — it still works for URL-based creation.

- [ ] **Step 3: Verify locally**

```bash
cd backend && npm run dev
```

Test with curl (requires a running local DB — skip if not available, will verify after deploy):
```bash
curl -X POST http://localhost:5000/api/properties/1/documents/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@test.pdf" \
  -F "title=Test Document" \
  -F "type=lease"
```

---

### Task 2: Backend — Add template upload endpoint

**Files:**
- Modify: `backend/src/controllers/DocumentTemplateController.js`
- Modify: `backend/src/routes/documentTemplateRoutes.js`

- [ ] **Step 1: Add upload method to DocumentTemplateController**

Add to `backend/src/controllers/DocumentTemplateController.js`:

```javascript
import supabase from '../config/supabase.js';
import crypto from 'crypto';

// Inside the class, after createFromUrl:

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
```

Also update `delete` to clean up storage:

```javascript
static async delete(req, res, next) {
  try {
    const template = await DocumentTemplateModel.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Clean up storage if possible
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
```

- [ ] **Step 2: Add upload route to documentTemplateRoutes.js**

In `backend/src/routes/documentTemplateRoutes.js`, add multer and the upload route:

```javascript
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
```

Add this route BEFORE the existing `router.post('/', ...)`:

```javascript
router.post(
  '/upload',
  authenticate,
  requireAdmin,
  upload.single('file'),
  DocumentTemplateController.upload,
);
```

Note: No express-validator on body fields here. With multipart/form-data, `req.body` isn't populated until multer runs, so `body('title')` would fail if placed before multer. Title and category are validated inside the controller instead (same pattern as `PropertyMediaController.upload`).
```

---

### Task 3: Frontend — Switch ImageUploader to backend API

**Files:**
- Modify: `admin-dashboard/src/components/ImageUploader.jsx`

- [ ] **Step 1: Replace Supabase upload with backend FormData POST**

In `ImageUploader.jsx`, remove the supabase import and replace the upload logic. The key change is in `uploadFile`:

```javascript
// REMOVE: import supabase from '../config/supabase.js';

const uploadFile = useCallback(async (file) => {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    setError(`Unsupported file type: ${file.type}. Use JPEG, PNG, WebP, or GIF.`);
    return;
  }

  setUploading(true);
  setUploadProgress(0);
  setUploadFileName(file.name);
  setError(null);

  try {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('is_primary', 'false');

    setUploadProgress(30);

    const res = await apiClient.post(
      `/properties/${propertyId}/images`,
      formData,
      { timeout: 60000 }
    );

    setUploadProgress(100);
    setImages((prev) => [...prev, res.data]);
  } catch (err) {
    console.error('Upload failed:', err);
    setError(err.response?.data?.message || err.message || 'Upload failed. Please try again.');
  } finally {
    setTimeout(() => {
      setUploading(false);
      setUploadProgress(0);
      setUploadFileName('');
    }, 600);
  }
}, [propertyId]);
```

- [ ] **Step 2: Remove the Supabase fallback UI**

Delete the `if (!supabase)` block (lines 171-182) that shows "Image uploads require Supabase configuration." This is no longer needed — the backend handles everything.

---

### Task 4: Frontend — Switch DocumentUploader to backend API

**Files:**
- Modify: `admin-dashboard/src/components/DocumentUploader.jsx`

- [ ] **Step 1: Replace Supabase upload with backend FormData POST**

Remove the supabase import. Replace the `uploadFile` function:

```javascript
// REMOVE: import supabase from '../config/supabase.js';

const uploadFile = useCallback(async (file) => {
  if (file.size > MAX_FILE_SIZE) {
    setError(`File too large: ${(file.size / (1024 * 1024)).toFixed(1)} MB. Maximum is 10 MB.`);
    return;
  }

  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    setError('Please enter a document title before uploading.');
    return;
  }

  setUploading(true);
  setUploadProgress(0);
  setUploadFileName(file.name);
  setError(null);

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', trimmedTitle);
    formData.append('type', docType);

    setUploadProgress(30);

    const res = await apiClient.post(
      `/properties/${propertyId}/documents/upload`,
      formData,
      { timeout: 60000 }
    );

    setUploadProgress(100);
    setDocuments((prev) => [...prev, res.data]);
    setTitle('');
    setDocType('lease');
  } catch (err) {
    console.error('Upload failed:', err);
    setError(err.response?.data?.message || err.message || 'Upload failed. Please try again.');
  } finally {
    setTimeout(() => {
      setUploading(false);
      setUploadProgress(0);
      setUploadFileName('');
    }, 600);
  }
}, [propertyId, title, docType]);
```

- [ ] **Step 2: Remove the Supabase fallback UI**

Delete the `if (!supabase)` block (lines 176-187).

---

### Task 5: Frontend — Switch TemplatesSidePanel to backend API

**Files:**
- Modify: `admin-dashboard/src/components/TemplatesSidePanel.jsx`

- [ ] **Step 1: Replace Supabase upload with backend FormData POST**

Remove the supabase import. Replace the `handleFileSelect` upload logic:

```javascript
// REMOVE: import supabase from '../config/supabase.js';

const handleFileSelect = useCallback(async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  e.target.value = '';
  setError(null);

  if (file.size > MAX_FILE_SIZE) {
    setError(`File too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`);
    return;
  }

  if (!title.trim()) {
    setError('Please enter a title before uploading.');
    return;
  }

  setUploading(true);

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title.trim());
    formData.append('category', category);

    await apiClient.post('/templates/upload', formData, { timeout: 60000 });

    setTitle('');
    setCategory('lease');
    await fetchTemplates();
  } catch (err) {
    console.error('Upload failed:', err);
    setError(err.response?.data?.message || err.message || 'Upload failed. Please try again.');
  } finally {
    setUploading(false);
  }
}, [title, category, fetchTemplates]);
```

- [ ] **Step 2: Remove the Supabase null check**

Delete the `if (!supabase)` block inside `handleFileSelect` (the "Storage not configured" error). No longer needed.

---

### Task 6: Remove Supabase from admin dashboard

**Files:**
- Delete: `admin-dashboard/src/config/supabase.js`
- Modify: `admin-dashboard/package.json`

- [ ] **Step 1: Delete the Supabase config file**

```bash
rm admin-dashboard/src/config/supabase.js
```

- [ ] **Step 2: Remove the dependency**

```bash
cd admin-dashboard && npm uninstall @supabase/supabase-js
```

- [ ] **Step 3: Verify build**

```bash
cd admin-dashboard && npm run build
```

The build must succeed with zero Supabase import errors. If any file still imports supabase, the build will fail — fix any missed imports.

---

### Task 7: Deploy and verify

- [ ] **Step 1: Confirm prerequisite**

Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set on Josh's Vercel project (Production environment). Josh must confirm this was done in the dashboard.

- [ ] **Step 2: Deploy**

```bash
bash scripts/deploy.sh all
```

Deploy public site first (backend gets new endpoints), then admin (frontend uses them).

- [ ] **Step 3: Smoke test**

1. Hit `https://easy-rental.ca/api/health` — should return `{"status":"API is running"}`
2. Hit `https://easy-rental.ca/api/properties?limit=1` — should return property data
3. Hit `https://admin.easy-rental.ca` — should return 200
4. Log into admin dashboard, navigate to a property, attempt an image upload
5. Verify the uploaded image appears in the property detail

- [ ] **Step 4: Verify no Supabase in admin bundle**

```bash
curl -s "https://admin.easy-rental.ca" | grep -o 'src="[^"]*\.js"' | head -1
# Use the actual JS filename from above:
curl -s "https://admin.easy-rental.ca/assets/<actual-hash>.js" | grep -c "supabase\.co"
```

Should return `0`. If it returns any number greater than 0, the Supabase client wasn't fully removed.
