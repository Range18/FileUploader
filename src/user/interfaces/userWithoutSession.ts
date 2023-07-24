import { UserPayload } from './userPayload';

export type UserWithoutSession = Pick<
  UserPayload,
  'UUID' | 'email' | 'isVerified'
>;
