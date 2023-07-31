import { Expose } from 'class-transformer';

export class CreateLinkRdo {
  @Expose()
  isMailed: boolean;

  @Expose()
  link: string;
}
