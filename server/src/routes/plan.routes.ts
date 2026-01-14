import { Router } from "express";
import plansController from "@/controllers/plans.controller";
import { authorize } from "@/middlewares/auth.middleware";

const routes = Router();

routes.get("/", plansController.getPlans);
routes.get("/admin", authorize(["admin"]), plansController.getPlansByAdmin);
routes.get("/:id", plansController.getPlanById);
routes.post("/", authorize(["admin"]), plansController.createPlan);
routes.put("/:id", authorize(["admin"]), plansController.updatePlan);
routes.delete("/:id", authorize(["admin"]), plansController.deletePlan);

export default routes;