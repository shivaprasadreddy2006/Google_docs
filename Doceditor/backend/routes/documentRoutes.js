const express = require('express');
const { createDocument, getDocuments, getDocumentById } = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/').post(protect, createDocument).get(protect, getDocuments);
router.route('/:id').get(protect, getDocumentById);

module.exports = router;
