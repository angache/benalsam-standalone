import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadRateLimiter, fileSizeLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../middleware/errorHandler';
import { uploadController } from '../controllers/uploadController';

const router = Router();

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, '../../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Configure multer for file uploads (disk storage - production ready)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.RATE_LIMIT_MAX_FILE_SIZE || '10485760'), // 10MB
    files: parseInt(process.env.RATE_LIMIT_MAX_FILES_PER_REQUEST || '10') // Max 10 files
  }
});

// Apply rate limiting to all upload routes
router.use(uploadRateLimiter);

// Apply file size limiting
router.use(fileSizeLimiter);

/**
 * @route   POST /api/v1/upload/listings
 * @desc    Upload listing images
 * @access  Private
 */
router.post('/listings',
  upload.array('images', 10),
  asyncHandler(uploadController.uploadListingImages)
);

/**
 * @route   POST /api/v1/upload/inventory
 * @desc    Upload inventory images
 * @access  Private
 */
router.post('/inventory',
  upload.array('images', 10),
  asyncHandler(uploadController.uploadInventoryImages)
);

/**
 * @route   POST /api/v1/upload/profile
 * @desc    Upload profile image
 * @access  Private
 */
router.post('/profile',
  upload.single('image'),
  asyncHandler(uploadController.uploadProfileImage)
);

/**
 * @route   GET /api/v1/upload/quota
 * @desc    Get user upload quota
 * @access  Private
 */
router.get('/quota',
  asyncHandler(uploadController.getUserQuota)
);

/**
 * @route   DELETE /api/v1/upload/:id
 * @desc    Delete uploaded image
 * @access  Private
 */
router.delete('/:id',
  asyncHandler(uploadController.deleteImage)
);

export default router;
