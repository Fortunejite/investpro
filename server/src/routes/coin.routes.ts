import { Router } from 'express';
import CoinController from '@/controllers/coin.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';

const routes = Router();

routes.get('/', CoinController.getCoins);
routes.get('/:id', CoinController.getCoinById);
routes.post('/sync', authenticate, authorize(['admin']), CoinController.syncCoins);

export default routes;
