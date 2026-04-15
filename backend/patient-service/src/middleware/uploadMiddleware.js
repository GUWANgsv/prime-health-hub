const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'reports');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname) || '';
    const baseName = path.basename(file.originalname, extension).replace(/[^a-zA-Z0-9-_]/g, '_');
    cb(null, `${Date.now()}-${baseName}${extension}`);
  }
});

const fileFilter = (_req, file, cb) => {
  if (!file || !file.mimetype) {
    return cb(new Error('Invalid file upload'));
  }

  cb(null, true);
};

const uploadReportFile = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter
});

module.exports = {
  uploadReportFile
};
