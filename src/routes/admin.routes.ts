import { Router } from 'express';
import adminController from '../controllers/adminController';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorizeAdmin);

router.get('/tasks', adminController.getAllTasks.bind(adminController));

export default router;