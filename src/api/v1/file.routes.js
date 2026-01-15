const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fileController = require('../../controllers/file.controller');
const authMiddleware = require('../../middlewares/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// File scanning routes
router.post('/scan', authMiddleware, upload.single('file'), fileController.scanFile);
router.get('/scan/:id', authMiddleware, fileController.getScanResult);
router.post('/quarantine', authMiddleware, fileController.quarantineFile);

module.exports = router;
