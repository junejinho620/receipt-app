const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/x-m4a'];

const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_AUDIO_TYPES];

// File size limits
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_AUDIO_SIZE = 20 * 1024 * 1024; // 20MB

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_VIDEO_SIZE, // Use largest limit, check specific limits in middleware
    files: 10 // Max 10 files per request
  }
});

// Middleware to check file sizes based on type
const checkFileSize = (req, res, next) => {
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      let maxSize;
      if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        maxSize = MAX_IMAGE_SIZE;
      } else if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
        maxSize = MAX_VIDEO_SIZE;
      } else if (ALLOWED_AUDIO_TYPES.includes(file.mimetype)) {
        maxSize = MAX_AUDIO_SIZE;
      }

      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          error: `File ${file.originalname} exceeds size limit`
        });
      }
    }
  }
  next();
};

// Export with size check middleware
const uploadMiddleware = {
  single: (fieldName) => [upload.single(fieldName), checkFileSize],
  array: (fieldName, maxCount) => [upload.array(fieldName, maxCount), checkFileSize],
  fields: (fields) => [upload.fields(fields), checkFileSize]
};

module.exports = upload;
module.exports.checkFileSize = checkFileSize;
module.exports.ALLOWED_TYPES = ALLOWED_TYPES;
