import { Router } from "express";
import UserController from "@/controllers/user.controller";

const router = Router();

router.get("/", UserController.getUsers);
router.get("/:id", UserController.getUser);
router.patch("/:id/ban", UserController.banUser);
router.patch("/:id/unban", UserController.unbanUser);

export default router;
