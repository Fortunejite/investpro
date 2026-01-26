import { Router } from 'express';
import AssetController from '@/controllers/asset.controller';

const routes = Router();

routes.get('/', AssetController.getAssets);

export default routes;
