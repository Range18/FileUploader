export class PwdResetCode {
  constructor(
    readonly id: number,
    readonly userUUID: string,
    readonly code: string,
    readonly expireIn: Date,
  ) {}
}
