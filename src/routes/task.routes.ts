import { Router } from 'express';
import taskController from '../controllers/taskController';
import { authenticate } from '../middleware/auth';
import { validateTask, validateTaskUpdate } from '../middleware/validator';

const router = Router();

router.use(authenticate);

router.get('/', taskController.getTasks.bind(taskController));
router.post('/', validateTask, taskController.createTask.bind(taskController));
router.put('/:taskId', validateTaskUpdate, taskController.updateTask.bind(taskController));
router.delete('/:taskId', taskController.deleteTask.bind(taskController));

export default router;