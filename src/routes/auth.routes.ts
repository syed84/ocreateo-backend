import { Router } from 'express';
import authController from '../controllers/authController';
import { validateRegister, validateLogin } from '../middleware/validator';

const router = Router();

router.post('/register', validateRegister, authController.register.bind(authController));
router.post('/login', validateLogin, authController.login.bind(authController));

export default router;