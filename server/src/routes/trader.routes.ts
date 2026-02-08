import { Router } from 'express';
import TraderController from '@/controllers/trader.controller';
import { authenticate, authorize } from "@/middlewares/auth.middleware";

const router = Router();

router.get('/', TraderController.getAllTraders);
router.post('/', authenticate, authorize(['admin']), TraderController.createTraderProfile);
router.get("/copied", authenticate, TraderController.getCopiedTraders);
router.put('/:id', authenticate, TraderController.editTraderProfile);
router.delete('/:id', authenticate, TraderController.deleteTraderProfile);

router.post('/:id/copy', authenticate, TraderController.copyTrader);
router.delete('/:id/copy', authenticate, TraderController.unCopyTrader);

export default router;