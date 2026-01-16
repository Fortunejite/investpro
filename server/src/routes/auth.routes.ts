import { Router } from "express";
import authController from "@/controllers/auth.controller";
import { authenticate } from "@/middlewares/auth.middleware";

const routes = Router();

routes.post("/register", authController.registerUser);
routes.post("/login", authController.loginUser);
routes.post("/logout", authenticate, authController.logout);
routes.get("/verify", authenticate, authController.verifyToken);
routes.post("/refresh", authController.refreshToken);
routes.post("/forgot-password", authController.forgotPassword);
routes.post("/reset-password", authController.resetPassword);

export default routes;