import {
  ArgumentMetadata,
  HttpStatus,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ApiException } from '@/common/Exceptions/ApiException';
import { OtherExceptions } from '@/common/Exceptions/ExceptionTypes/OtherExceptions';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata): Promise<any> {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    const object = plainToInstance(metatype, value);
    const errors: string[] = (await validate(object)).map((value) => {
      return `${value.property}: ${Object.values(value.constraints)}`;
    });
    if (errors.length > 0) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        OtherExceptions.ValidationException,
        errors,
      );
    }
    return value;
  }

  private toValidate(metatype): boolean {
    const types = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
