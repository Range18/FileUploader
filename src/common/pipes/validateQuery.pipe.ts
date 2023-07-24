import { ArgumentMetadata, HttpStatus, PipeTransform } from '@nestjs/common';
import { ApiException } from '../Exceptions/ApiException';
import { OtherExceptions } from '../Exceptions/ExceptionTypes/OtherExceptions';

export class ValidateQueryPipe implements PipeTransform {
  constructor(private allowedQueries: string[]) {}

  transform(value: any, metadata: ArgumentMetadata): any {
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
