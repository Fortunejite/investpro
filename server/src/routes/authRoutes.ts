import { Router } from "express";
import authController from "@/controllers/authController";

const routes = Router();

routes.post("/register", authController.registerUser);
routes.post("/login", authController.loginUser);
routes.get("/verify", authController.verifyToken);

export default routes;