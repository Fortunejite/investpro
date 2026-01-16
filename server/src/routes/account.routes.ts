import { Router } from "express";
import accountController from "@/controllers/account.controller";
import { authorize } from "@/middlewares/auth.middleware";

const routes = Router();

routes.get("/", accountController.getUserAccount);
routes.get("/admin", authorize(["admin"]), accountController.getAllAccounts);

export default routes;