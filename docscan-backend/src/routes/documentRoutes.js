const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');

console.log('Initializing document routes...');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads');
        console.log('Upload directory:', uploadDir);
        if (!fs.existsSync(uploadDir)) {
            console.log('Creating upload directory');
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        console.log('File being uploaded:', file.originalname);
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Debug middleware
router.use((req, res, next) => {
    console.log(`Document route hit: ${req.method} ${req.url}`);
    next();
});

// Protected routes
router.post('/upload', auth, upload.single('document'), documentController.uploadDocument);
router.post('/:id/summary', auth, documentController.generateSummary);
router.post('/:id/quiz', auth, documentController.generateQuiz);
router.post('/save-score', auth, documentController.saveQuizScore);

// Public routes
router.get('/', documentController.getDocuments);
router.get('/:id', documentController.getDocument);

console.log('Document routes initialized');

module.exports = router; 