import { Router } from 'express';
import AssetController from '@/controllers/asset.controller';

const routes = Router();

routes.get('/', AssetController.getAssets);
routes.get('/:id', AssetController.getAssetById);

export default routes;
