import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  // Zod validation error
  if (err instanceof ZodError) {
    const issues = err.issues.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json(
      { error: 'ValidationError', issues },
    );
  }

  // Fallback
  return res.status((err as unknown as { status: number }).status || 500).json(
    { error: (err as { message: string }).message || 'InternalServerError', message: (err as { message: string }).message || 'Something went wrong' },
  );
};
export default errorHandler;