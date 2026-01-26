import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { PrismaClientKnownRequestError, PrismaClientUnknownRequestError, PrismaClientValidationError } from "@prisma/client/runtime/client";
import { AxiosError } from "axios";

const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
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

  if (err instanceof AxiosError) {
    const status = err.response?.status || 500;
    const message = err.response?.data?.message || 'External API Error';
    return res.status(status).json(
      { error: 'ExternalAPIError', message },
    );
  }

  console.error(err.stack);

  // Prisma Known Request Error (P2xxx codes)
  if (err instanceof PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        // Unique constraint violation
        const target = err.meta?.target as string[] || [];
        return res.status(409).json({
          error: 'ConflictError',
          message: `A record with this ${target.join(', ')} already exists`,
        });
      
      case 'P2025':
        // Record not found
        return res.status(404).json({
          error: 'NotFoundError',
          message: 'The requested record was not found',
        });
      
      case 'P2003':
        // Foreign key constraint violation
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Invalid reference to related record',
        });
      
      case 'P2014':
        // Invalid ID
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Invalid ID provided',
        });
      
      case 'P2021':
        // Table does not exist
        return res.status(500).json({
          error: 'DatabaseError',
          message: 'Database configuration error',
        });
      
      default:
        return res.status(500).json({
          error: 'DatabaseError',
          message: 'A database error occurred',
        });
    }
  }

  // Prisma Client Validation Error
  if (err instanceof PrismaClientValidationError) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Invalid data provided to database operation',
    });
  }

  // Prisma Client Unknown Request Error
  if (err instanceof PrismaClientUnknownRequestError) {
    return res.status(500).json({
      error: 'DatabaseError',
      message: 'An unknown database error occurred',
    });
  }
  
  console.error(err.stack);
  // Fallback
  return res.status((err as unknown as { status: number }).status || 500).json(
    { error: (err as { message: string }).message || 'InternalServerError', message: (err as { message: string }).message || 'Something went wrong' },
  );
};
export default errorHandler;