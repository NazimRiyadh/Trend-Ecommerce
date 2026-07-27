const multer = require('multer');
const ApiError = require('../utils/ApiError');
const { StatusCodes } = require('http-status-codes');
const config = require('../config');
const fs = require('fs');
const path = require('path');

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

module.exports = upload;
