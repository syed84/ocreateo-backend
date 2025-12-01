import { Router } from 'express';
import websocketController from '../controllers/websocketController';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorizeAdmin);

router.get('/clients', websocketController.getConnectedClients.bind(websocketController));
router.post('/test-broadcast', websocketController.testBroadcast.bind(websocketController));

export default router;