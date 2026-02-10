import { Router } from 'express';
import PositionController from '@/controllers/position.controller';

const router = Router();

router.get('/', PositionController.getPositions);
router.post('/', PositionController.openPosition);
router.get('/:id', PositionController.getPositionById);
router.post("/:id/close", PositionController.closePosition);

export default router;