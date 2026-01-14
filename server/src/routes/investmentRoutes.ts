import { Router } from "express";
import InvestmentController from "@/controllers/investmentController";
import { authorize } from "@/middlewares/authMiddleware";

const routes = Router();

routes.post("/", InvestmentController.createInvestment);
routes.get("/", InvestmentController.getUserInvestments);
routes.get("/admin", authorize(['admin']), InvestmentController.getAllInvestments);
routes.get("/:id", InvestmentController.getUserInvestmentById);

routes.post("/:id/end", authorize(['admin']), InvestmentController.endInvestment);

export default routes;