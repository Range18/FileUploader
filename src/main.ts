import { AppModule } from './app.module';
import { apiServer } from './common/configs/config';
import { HttpExceptionFilter } from './common/Exceptions/http-exception.filter';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@/common/pipes/validationPipe.pipe';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //Network utilities
  app.use(helmet());
  app.use(cookieParser());

  //API global checkers
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(apiServer.port);
}
bootstrap();
