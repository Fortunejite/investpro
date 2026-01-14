import { Router } from "express";
import walletAccountController from "@/controllers/walletAccountController";

const routes = Router();

routes.get("/", walletAccountController.getUserWalletAccounts);
routes.get("/:id", walletAccountController.getWalletAccountById);
routes.post("/", walletAccountController.createWalletAccount);

export default routes;