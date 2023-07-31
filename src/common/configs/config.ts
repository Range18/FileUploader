import * as env from 'env-var';
import 'dotenv/config';
import ms from 'ms';

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
  refreshExpire: {
    ms() {
      return ms(this.value);
    },
    value: env.get('REFRESH_EXPIRE').default('30d').asString(),
  },
  accessExpire: {
    ms() {
      return ms(this.value);
    },
    value: env.get('ACCESS_EXPIRE').default('15min').asString(),
  },
};
export const bcryptRounds = 10;
export const pwdResetExpire = {
  ms() {
    return ms(this.value);
  },
  value: env.get('PWD_RESET_CODE_EXPIRE').default('24h').asString(),
};
