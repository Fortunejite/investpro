import { Router } from 'express';
import PriceController from '@/controllers/market.controller';

const routes = Router();

routes.get('/price/:coin', PriceController.getCurrentPrice);
routes.get('/coins', PriceController.getCoinsData);
routes.get('/coins/:id', PriceController.getCoinById);

export default routes;
