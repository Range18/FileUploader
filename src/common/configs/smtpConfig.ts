import * as env from 'env-var';

export const smtpSettings = {
  host: env.get('SMTP_HOST').required().asString(),
  port: env.get('SMTP_PORT').default(465).asPortNumber(),
  secure: env.get('SMTP_SECURE').default(1).asBool(),
  auth: {
    user: env.get('SMTP_USER').required().asEmailString(),
    pass: env.get('SMTP_PASS').required().asString(),
  },
};
