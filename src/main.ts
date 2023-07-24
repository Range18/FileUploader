import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { apiServer } from './common/configs/config';
import { HttpExceptionFilter } from './common/Exceptions/http-exception.filter';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.useGlobalFilters(new HttpExceptionFilter());
  // app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser());
  await app.listen(apiServer.port);
}
bootstrap();
