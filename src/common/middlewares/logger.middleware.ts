import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger: Logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req;

    // const userAgent = req.get('user-agent') || '';

    res.on('finish', () => {
      const { statusCode } = res;

      this.logger.log(`${method} ${originalUrl} ${statusCode} ${ip}`);
    });

    next();
  }
}
