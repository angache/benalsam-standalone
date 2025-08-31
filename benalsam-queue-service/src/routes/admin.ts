import { Router } from 'express';
import { createBullBoardInstance } from '../config/bullBoard';

const router = Router();

// Bull Board dashboard
router.use('/queues', createBullBoardInstance().router);

export default router;
