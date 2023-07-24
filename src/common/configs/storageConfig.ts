import * as env from 'env-var';

export const storageConfig = {
  storagePath: env.get('STORAGE_PATH').required().asString(),
  maxSize: env
    .get('MAX_FILE_SIZE')
    .default(1024 ** 4)
    .asIntPositive(),
};
