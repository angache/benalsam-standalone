import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import inventoryController from '../controllers/inventoryController';
import { authenticateToken } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rateLimit';

const router = Router();

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, '../../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Configure multer for file uploads - same as listing upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
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
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Max 10 files
  }
});

// Apply authentication middleware to all inventory routes
router.use(authenticateToken);

// Apply rate limiting
router.use(rateLimitMiddleware.api);

/**
 * @route   GET /api/v1/inventory
 * @desc    Get user's inventory items
 * @access  Private
 */
router.get('/', inventoryController.getInventoryItems);

/**
 * @route   POST /api/v1/inventory
 * @desc    Add new inventory item
 * @access  Private
 */
router.post('/', inventoryController.addInventoryItem);

/**
 * @route   GET /api/v1/inventory/:id
 * @desc    Get inventory item by ID
 * @access  Private
 */
router.get('/:id', inventoryController.getInventoryItemById);

/**
 * @route   PUT /api/v1/inventory/:id
 * @desc    Update inventory item
 * @access  Private
 */
router.put('/:id', inventoryController.updateInventoryItem);

/**
 * @route   DELETE /api/v1/inventory/:id
 * @desc    Delete inventory item
 * @access  Private
 */
router.delete('/:id', inventoryController.deleteInventoryItem);

/**
 * @route   POST /api/v1/inventory/upload-images
 * @desc    Upload inventory images to Cloudinary
 * @access  Private
 */
router.post('/upload-images',
  upload.array('images', 10), // Max 10 images - same as listing
  inventoryController.uploadInventoryImages
);

export default router;
