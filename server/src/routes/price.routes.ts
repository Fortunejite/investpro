import { Router } from "express";
import PriceController from "@/controllers/price.controller";

const routes = Router();

routes.get("/", PriceController.getCurrentPrice);
routes.get("/:coin", PriceController.getCurrentPrice);

export default routes;