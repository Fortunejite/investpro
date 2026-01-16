import { Router } from "express";
import TradeSignalController from "@/controllers/tradeSignal.controller";
import { authorize } from "@/middlewares/auth.middleware";

const routes = Router();

routes.post("/", authorize(['admin']), TradeSignalController.createTradeSignal);
routes.get("/", TradeSignalController.getTradeSignals);
routes.post("/subscribe", TradeSignalController.subscribeToSignals);
routes.get("/subscription", TradeSignalController.getSubscriptionStatus);
routes.get("/subscribers", authorize(['admin']), TradeSignalController.getAllSubscribers);
routes.get("/:id", TradeSignalController.getTradeSignalById);
routes.put("/:id", authorize(['admin']), TradeSignalController.updateTradeSignal);
routes.delete("/:id", authorize(['admin']), TradeSignalController.deleteTradeSignal);

export default routes;
