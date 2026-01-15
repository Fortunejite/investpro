import { Router } from "express";
import accountController from "@/controllers/account.controller";

const routes = Router();

routes.get("/", accountController.getUserAccount);

export default routes;