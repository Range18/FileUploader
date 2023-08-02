import { ApiException } from '../Exceptions/ApiException';
import { OtherExceptions } from '../Exceptions/ExceptionTypes/OtherExceptions';
import { HttpStatus, PipeTransform } from '@nestjs/common';

export class ValidateQueryPipe implements PipeTransform {
  constructor(private allowedQueries: string[]) {}

  transform(value: any): any {
    let isAllowed = false;
    for (const elem of this.allowedQueries) {
      if (value == elem) {
        isAllowed = true;
        break;
      }
    }
    if (!isAllowed) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'OtherExceptions',
        OtherExceptions.InvalidQueryParameter,
      );
    }
    return value;
  }
}
