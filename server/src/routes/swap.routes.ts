import { Router } from 'express';
import SwapController from '@/controllers/swap.controller';

const routes = Router();

routes.get('/', SwapController.getSwaps);
routes.post('/', SwapController.swapAssets);

export default routes;
