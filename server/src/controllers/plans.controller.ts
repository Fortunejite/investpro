import { prisma } from '@/lib/prisma';
import { Request, Response, NextFunction } from 'express';
import z from 'zod';

const createPlanSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  minAmount: z.number().positive(),
  durationInDays: z.number().int().positive(),
  roiPercent: z.number().positive(),
  payoutType: z.enum(['daily', 'weekly', 'monthly', 'end_of_term']),
});

const updatePlanSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional(),
  minAmount: z.number().positive().optional(),
  durationInDays: z.number().int().positive().optional(),
  roiPercent: z.number().positive().optional(),
  payoutType: z.enum(['daily', 'weekly', 'monthly', 'end_of_term']).optional(),
  isActive: z.boolean().optional(),
});

class PlansController {
  createPlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createPlanSchema.parse(req.body);

      const newPlan = await prisma.investmentPlan.create({
        data: validatedData,
      });

      res.status(201).json(newPlan);
    } catch (err) {
      next(err);
    }
  };

  getPlans = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plans = await prisma.investmentPlan.findMany({
        where: { isActive: true },
      });
      res.status(200).json({ data: plans });
    } catch (err) {
      next(err);
    }
  };

  getPlansByAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams = req.query;

      const isActive =
        queryParams.isActive === 'true'
          ? true
          : queryParams.isActive === 'false'
          ? false
          : undefined;

      const plans = await prisma.investmentPlan.findMany({
        where: { isActive },
      });
      res.status(200).json({ data: plans });
    } catch (err) {
      next(err);
    }
  };

  getPlanById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const planId = parseInt(req.params.id as string, 10);

      const plan = await prisma.investmentPlan.findUnique({
        where: { id: planId },
      });

      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
      }

      res.status(200).json(plan);
    } catch (err) {
      next(err);
    }
  };

  updatePlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const planId = parseInt(req.params.id as string, 10);
      const validatedData = updatePlanSchema.parse(req.body);

      const updatedPlan = await prisma.investmentPlan.update({
        where: { id: planId },
        data: validatedData,
      });

      res.status(200).json(updatedPlan);
    } catch (err) {
      next(err);
    }
  };

  deletePlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const planId = parseInt(req.params.id as string, 10);

      await prisma.investmentPlan.delete({
        where: { id: planId },
      });

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}

export default new PlansController();
