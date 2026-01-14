import { Router } from "express";
import plansController from "@/controllers/plansController";
import { authorize } from "@/middlewares/authMiddleware";

const routes = Router();

routes.get("/", plansController.getPlans);
routes.post("/", authorize(["admin"]), plansController.createPlan);
routes.put("/:id", authorize(["admin"]), plansController.updatePlan);
routes.delete("/:id", authorize(["admin"]), plansController.deletePlan);

export default routes;