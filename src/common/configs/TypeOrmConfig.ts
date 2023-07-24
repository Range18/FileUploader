import { type TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as env from 'env-var';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: env.get('DB_HOST').default('localhost').asString(),
  port: env.get('DB_PORT').default(3306).asPortNumber(),
  username: env.get('DB_USER').required().asString(),
  password: env.get('DB_PASS').required().asString(),
  database: env.get('DB_NAME').required().asString(),
  autoLoadEntities: true,
  synchronize: env.get('SYNC_DB').default(0).asBool(),
  dropSchema: env.get('DROP_DB').default(0).asBool(),
};
