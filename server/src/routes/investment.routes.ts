import { Router } from "express";
import InvestmentController from "@/controllers/investment.controller";
import { authorize } from "@/middlewares/auth.middleware";

const routes = Router();

routes.post("/", InvestmentController.createInvestment);
routes.get("/", InvestmentController.getUserInvestments);
routes.get("/admin", authorize(['admin']), InvestmentController.getAllInvestments);
routes.get("/:id", InvestmentController.getUserInvestmentById);

routes.post("/:id/end", authorize(['admin']), InvestmentController.endInvestment);

export default routes;