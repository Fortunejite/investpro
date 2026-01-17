import { Request, Response, NextFunction } from 'express';
import { prisma } from "@/lib/prisma";

const settingsConstants = [
  // Admin Addresses
  "btcAddress",
  "ethAddress",
  "bnbAddress",
  "solAddress",

  // Telegram Settings
  "telegramBotToken"
];

const clientAccessibleSettings = [
  // Admin Addresses
  "btcAddress",
  "ethAddress",
  "bnbAddress",
  "solAddress",
];

class SettingsController {
  getSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isAdmin = req.user.role === 'admin';
      const settings = await prisma.settings.findMany({
        where: { key: { in: isAdmin ? settingsConstants : clientAccessibleSettings } }
      });

      const settingsData: any = {};
      settings.forEach((setting) => {
        settingsData[setting.key] = setting.value;
      });
      res.status(200).json(settingsData);
    } catch (error) {
      next(error);
    }
  };

  getSettingByKey = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = req.params.key as string;
      const isAdmin = req.user.role === 'admin';

      if (!settingsConstants.includes(key)) {
        return res.status(400).json({ message: "Invalid setting key" });
      }

      if (!isAdmin && !clientAccessibleSettings.includes(key)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const setting = await prisma.settings.findUnique({
        where: { key }
      });

      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }

      res.status(200).json({ key: setting.key, value: setting.value });
    } catch (error) {
      next(error);
    }
  };

  // Admin Actions

  createSetting = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { key, value } = req.body;

      if (!settingsConstants.includes(key)) {
        return res.status(400).json({ message: "Invalid setting key" });
      }

      const existingSetting = await prisma.settings.findUnique({ where: { key } });
      if (existingSetting) {
        return res.status(400).json({ message: "Setting already exists" });
      }

      const newSetting = await prisma.settings.create({
        data: { key, value },
      });

      res.status(201).json({ key: newSetting.key, value: newSetting.value });
    } catch (error) {
      next(error);
    }
  };

  updateSetting = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = req.params.key as string;
      const { value } = req.body;

      if (!settingsConstants.includes(key)) {
        return res.status(400).json({ message: "Invalid setting key" });
      }

      const updatedSetting = await prisma.settings.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });

      res.status(200).json({ key: updatedSetting.key, value: updatedSetting.value });
    } catch (error) {
      next(error);
    }
  };

  deleteSetting = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = req.params.key as string;
      if (!settingsConstants.includes(key)) {
        return res.status(400).json({ message: "Invalid setting key" });
      }

      const deletedSetting = await prisma.settings.delete({
        where: { key }
      });

      res.status(200).json({ key: deletedSetting.key, value: deletedSetting.value });
    } catch (error) {
      next(error);
    }
  };
}

export default new SettingsController();