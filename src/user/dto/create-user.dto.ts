import { PASSWORD, USERNAME } from '@/user/user.constants';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  Length,
} from 'class-validator';

export class CreateUserDto {
  @Length(USERNAME.MIN, USERNAME.MAX)
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsEmail({}, { message: 'Invalid  email address' })
  @IsNotEmpty()
  email: string;

  @IsStrongPassword({
    minLength: PASSWORD.MIN_LENGTH,
    minLowercase: PASSWORD.MIN_LOWERCASE,
    minNumbers: PASSWORD.MIN_NUMBERS,
    minSymbols: PASSWORD.MIN_SYMBOLS,
    minUppercase: PASSWORD.MIN_UPPERCASE,
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
