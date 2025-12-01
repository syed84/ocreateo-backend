import { Router } from 'express';
import cronController from '../controllers/cronController';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorizeAdmin);

router.post('/trigger-reminders', cronController.triggerReminders.bind(cronController));
router.get('/status', cronController.getCronStatus.bind(cronController));

export default router;