import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiException } from './ApiException';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): any {
    const HttpContext = host.switchToHttp();
    const response: Response = HttpContext.getResponse();

    const statusCode =
      exception instanceof ApiException
        ? exception.statusCode
        : exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof ApiException
        ? exception
        : exception instanceof HttpException
        ? {
            status: statusCode,
            error: {
              type: exception.message,
              message: exception.cause,
            },
          }
        : {
            status: statusCode,
            error: {
              type: 'INTERNAL_SERVER_ERROR',
              message: 'Uncaught error',
            },
          };

    if (statusCode == HttpStatus.INTERNAL_SERVER_ERROR) {
      console.log(exception);
    }

    response.status(statusCode).json(message);
  }
}
