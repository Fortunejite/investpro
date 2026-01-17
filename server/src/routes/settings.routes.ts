import { Router } from "express";
import SettingsController from "@/controllers/settings.controller";
import { authorize } from "@/middlewares/auth.middleware";

const routes = Router();

routes.get("/", SettingsController.getSettings);
routes.get("/:key", SettingsController.getSettingByKey);
routes.post("/", authorize(["admin"]), SettingsController.createSetting);
routes.put("/:key", authorize(["admin"]), SettingsController.updateSetting);
routes.delete("/:key", authorize(["admin"]), SettingsController.deleteSetting);

export default routes;