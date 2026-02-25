import { Router } from 'express';
import statsController from '@/controllers/stats.controller';
import { authorize } from '@/middlewares/auth.middleware';

const router = Router();

router.get('/user', statsController.getUserStats);
router.get('/admin', authorize(['admin']), statsController.getAdminStats);

export default router;
