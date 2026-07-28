import multer from 'multer';
import config from '../config/index.js';
import fs from 'fs';

// Ensure upload directory exists
if (!fs.existsSync(config.upload.dir)) {
  fs.mkdirSync(config.upload.dir, { recursive: true });
}

// Multer memory storage - we'll save it after checking magic bytes with file-type
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxSize,
  }
});

export default upload;
