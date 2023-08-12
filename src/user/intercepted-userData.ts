import { UserPayload } from '@/user/userPayload';
import { Roles } from '@/permissions/roles.constant';

export class InterceptedUserData implements UserPayload {
  readonly UUID: string;
  readonly email: string;
  readonly roles: Roles[];
  readonly sessionUUID: string;
}
