import { Router } from "express";
import TransactionController from "@/controllers/transaction.controller";
import { authorize } from "@/middlewares/auth.middleware";

const routes = Router();

routes.get("/", TransactionController.getUserTransactions);
routes.get("/admin", authorize(['admin']), TransactionController.getAllTransactions);
routes.get("/admin/:id", authorize(['admin']), TransactionController.getTransactionById);
routes.get("/:id", TransactionController.getUserTransactionById);

export default routes;