const multer = require('multer');
const ApiError = require('../utils/apiError');

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter for audio files
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'audio/wav',
    'audio/mpeg',
    'audio/mp3',
    'audio/ogg',
    'audio/flac',
    'audio/x-wav',
    'audio/webm'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest('Invalid file type. Only audio files are allowed.'), false);
  }
};

// Configure multer upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

module.exports = upload;

