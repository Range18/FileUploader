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

export type CustomException = typeof customExceptions;

export type ExceptionType<T extends keyof CustomException> =
  keyof CustomException[T];

export type ExceptionMessage<T extends keyof CustomException> =
  CustomException[T][ExceptionType<T>];
export class ApiException<T extends keyof CustomException> {
  public readonly statusCode: HttpStatus;
  public readonly error: {
    type: string;
    message: ExceptionMessage<T> | string[];
  };

  constructor(
    statusCode: HttpStatus,
    exceptionType: T | OtherExceptions.ValidationException,
    message: ExceptionMessage<T> | string[],
  ) {
    let type: string;
    if (exceptionType !== OtherExceptions.ValidationException)
      type = this.getKeyByValue(
        customExceptions[exceptionType],
        <string>message,
      );
    else type = exceptionType;

    this.statusCode = statusCode;
    this.error = {
      type: type,
      message: message,
    };
  }

  private getKeyByValue<T extends object>(
    enumObj: T,
    enumValue: string,
  ): string {
    const keys = Object.keys(enumObj) as (keyof T)[];

    for (const key of keys) {
      if (enumObj[key] === enumValue) {
        return <string>key;
      }
    }
  }
}
