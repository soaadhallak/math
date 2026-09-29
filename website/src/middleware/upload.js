import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directories exist
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
const imagesDir = path.join(uploadsDir, 'images');
const documentsDir = path.join(uploadsDir, 'documents');

for (const dir of [uploadsDir, imagesDir, documentsDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/** Normalize basename to slug: lowercase, spaces to hyphens, only a-z0-9 and hyphens. */
function slugifyBasename(name) {
  const slug = (name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  return slug || 'image';
}

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.svg', '.webp', '.bmp', '.ico', '.avif']);

function getUploadSubdirectory(file) {
  const ext = (path.extname(file.originalname) || '').toLowerCase();
  if (file.mimetype?.startsWith('image/') || IMAGE_EXTENSIONS.has(ext)) {
    return 'images';
  }
  return 'documents';
}

export function getPublicUploadPath(file) {
  const subdir = file.uploadSubdirectory || getUploadSubdirectory(file);
  return `/uploads/${subdir}/${file.filename}`;
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subdir = getUploadSubdirectory(file);
    file.uploadSubdirectory = subdir;
    cb(null, path.join(uploadsDir, subdir));
  },
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '').toLowerCase();
    const base = path.basename(file.originalname, path.extname(file.originalname));
    const slug = slugifyBasename(base);
    const timestamp = Date.now();
    const filename = `${slug}-${timestamp}${ext}`;
    cb(null, filename);
  },
});

// Allowed types: images + document files used by Document uploads
const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png|svg|webp|bmp|ico|avif|pdf|doc|docx|txt|ppt|pptx|xls|xlsx|csv|odt|rtf|md)$/i;
const ALLOWED_MIMETYPES = [
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'image/webp',
  'image/bmp',
  'image/x-icon',
  'image/vnd.microsoft.icon',
  'image/avif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/vnd.oasis.opendocument.text',
  'application/rtf',
  'text/markdown',
  'text/x-markdown',
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const extOk = ALLOWED_EXTENSIONS.test(ext);
  const mimetypeOk = ALLOWED_MIMETYPES.includes(file.mimetype);

  if (extOk && mimetypeOk) {
    return cb(null, true);
  }
  cb(new Error('Invalid file type. Allowed images: JPG, JPEG, PNG, SVG, WEBP, BMP, ICO, AVIF. Allowed documents: PDF, DOC, DOCX, TXT, PPT, PPTX, XLS, XLSX, CSV, ODT, RTF, MD.'));
};

// Maximum file size for uploads (10 MB)
export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

// Configure multer
export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_UPLOAD_SIZE_BYTES,
  },
  fileFilter,
});

// Middleware for single file upload
export const uploadSingle = (fieldName = 'file') => {
  return upload.single(fieldName);
};

// Middleware for multiple files
export const uploadMultiple = (fieldName = 'files', maxCount = 10) => {
  return upload.array(fieldName, maxCount);
};
