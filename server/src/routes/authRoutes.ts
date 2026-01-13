import { Router } from "express";
import authController from "@/controllers/authController";

const routes = Router();

routes.post("/register", authController.registerUser);
routes.post("/login", authController.loginUser);
routes.get("/verify", authController.verifyToken);
routes.post("/forgot-password", authController.forgotPassword);
routes.post("/reset-password", authController.resetPassword);

export default routes;