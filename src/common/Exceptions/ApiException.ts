import { UserExceptions } from './ExceptionTypes/UserExceptions';
import { HttpException, HttpStatus } from '@nestjs/common';
import { TokenExceptions } from './ExceptionTypes/TokenExceptions';
import { AuthExceptions } from './ExceptionTypes/AuthExceptions';
import { OtherExceptions } from './ExceptionTypes/OtherExceptions';
import { SessionExceptions } from './ExceptionTypes/SessionExceptions';
import { FileExceptions } from './ExceptionTypes/FileExceptions';

const customExceptions = {
  AuthExceptions,
  TokenExceptions,
  UserExceptions,
  OtherExceptions,
  SessionExceptions,
  FileExceptions,
  HttpExceptions: HttpException,
};
type CustomExceptions = typeof customExceptions;

type ExceptionType<T extends keyof CustomExceptions> = CustomExceptions[T];
export type ExceptionMessage<T extends keyof CustomExceptions> =
  ExceptionType<T>[keyof ExceptionType<T>];

export class ApiException<T extends keyof CustomExceptions> {
  public readonly status: HttpStatus;
  public readonly error: { type: T; message: ExceptionMessage<T> };
  public readonly validationErrors?: string[];
  constructor(
    status: HttpStatus,
    type: T,
    message: ExceptionMessage<T>,
    validationErrors?: string[],
  ) {
    this.status = status;
    this.error = {
      type,
      message,
    };

    if (validationErrors) this.validationErrors = validationErrors;
  }
}
