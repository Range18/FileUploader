import { GetSessionRdo } from '@/session/get-session.rdo';

export type UserSession = GetSessionRdo & { UUID: string };
