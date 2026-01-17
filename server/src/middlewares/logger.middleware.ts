import { Request, Response, NextFunction } from 'express';

const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const url = req.url;
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${url} ${res.statusCode} - ${duration}ms`
    );
  });
  next();
};

export default loggerMiddleware;
