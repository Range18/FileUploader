export class VerifyCode {
  constructor(
    readonly id: number,
    readonly userUUID: string,
    readonly code: string,
    readonly createdAt: Date,
  ) {}
}
