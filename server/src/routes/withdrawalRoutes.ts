import { Router } from "express";
import WithdrawalController from "@/controllers/withdrawController";
import { authorize } from "@/middlewares/authMiddleware";

const routes = Router();

routes.post("/", WithdrawalController.createWithdrawal);
routes.get("/", WithdrawalController.getUserWithdrawals);
routes.get("/admin", authorize(['admin']), WithdrawalController.getAllWithdrawals);
routes.get("/admin/:id", authorize(['admin']), WithdrawalController.getWithdrawalById);
routes.get("/:id", WithdrawalController.getUserWithdrawalById);
routes.get("/:id/cancel", WithdrawalController.cancelWithdrawal);
routes.post("/:id/approve", authorize(['admin']), WithdrawalController.approveWithdrawal);
routes.post("/:id/reject", authorize(['admin']), WithdrawalController.rejectWithdrawal);

export default routes;