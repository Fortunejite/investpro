import { Router } from "express";
import DepositController from "@/controllers/depositController";
import { authorize } from "@/middlewares/authMiddleware";

const routes = Router();

routes.post("/", DepositController.createDeposit);
routes.get("/", DepositController.getUserDeposits);
routes.get("/admin", authorize(['admin']), DepositController.getAllDeposits);
routes.get("/admin/:id", authorize(['admin']), DepositController.getDepositById);
routes.get("/:id", DepositController.getUserDepositById);
routes.post("/:id/approve", authorize(['admin']), DepositController.approveDeposit);
routes.post("/:id/reject", authorize(['admin']), DepositController.rejectDeposit);

export default routes;