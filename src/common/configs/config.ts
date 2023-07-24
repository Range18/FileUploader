import * as env from 'env-var';
import 'dotenv/config';

export const apiServer = {
  port: env.get('API_PORT').default(3000).asPortNumber(),
  host: env.get('API_HOST').default('localhost').asString(),
  secure: env.get('SECURE_MODE').default('true').asBool(),
  url: env
    .get('API_URL')
    .required()
    .default('http://localhost:3000')
    .asString(),
};

export const frontendServer = {
  port: env.get('FRONTEND_PORT').default(5000).asPortNumber(),
  host: env.get('FRONTEND_HOST').default('localhost').asString(),
  url: env.get('FRONTEND_URL').default('http://localhost:5000').asString(),
};
export const jwtSettings = {
  secret: env.get('SECRET').required().asString(),
  refreshExpire: '30d',
  accessExpire: '1h',
};
export const bcryptRounds = 10;
export const pwdResetExpire = '24h';
