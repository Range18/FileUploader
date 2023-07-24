import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { FindOptionsWhere, Repository } from 'typeorm';
import { CreateUserDto } from './dto/createUserDto';
import { ApiException } from '@/common/Exceptions/ApiException';
import { UserExceptions } from '@/common/Exceptions/ExceptionTypes/UserExceptions';
import { TokenExceptions } from '@/common/Exceptions/ExceptionTypes/TokenExceptions';
import * as bcrypt from 'bcrypt';
import { bcryptRounds } from '@/common/configs/config';
import { PassResetService } from './passReset/passReset.service';
import { AuthExceptions } from '@/common/Exceptions/ExceptionTypes/AuthExceptions';
import { ChangeEmailDto } from '@/user/dto/change-email.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly passResetService: PassResetService,
  ) {}

  // Methods to find users
  async findOneByUsername(username: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async findOneByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { email: email } });
  }

  async findByUUID(UUID: string): Promise<UserEntity | null> {
    return await this.userRepository.findOne({ where: { UUID } });
  }

  async findOne(
    key: keyof Omit<
      UserEntity,
      'password' | 'createdAt' | 'updatedAt' | 'isVerified'
    >,
    value: string,
  ): Promise<UserEntity | null> {
    return await this.userRepository.findOne({ where: { [key]: value } });
  }

  // Methods to create user
  async saveUser(user: CreateUserDto | UserEntity) {
    return await this.userRepository.save(user);
  }

  // Update User
  async changeUsername(UUID: string, newUsername: string) {
    const user = await this.userRepository.findOne({ where: { UUID } });
    if (!user) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'UserExceptions',
        UserExceptions.UserNotFound,
      );
    }

    const sameUsernameUser = await this.findOneByUsername(newUsername);
    if (sameUsernameUser) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'UserExceptions',
        UserExceptions.UserAlreadyExists,
      );
    }
    user.username = newUsername;
    await this.saveUser(user);
  }

  async resetPassword(code: string, newPassword: string) {
    const passResetRecord = await this.passResetService.findPassResetCode(code);
    if (!passResetRecord) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'TokenExceptions',
        TokenExceptions.InvalidToken,
      );
    }
    if (passResetRecord.expireIn < new Date(Date.now())) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'TokenExceptions',
        TokenExceptions.TokenExpired,
      );
    }
    const user = await this.findByUUID(passResetRecord.userUUID);
    if (!user) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'UserExceptions',
        UserExceptions.UserNotFound,
      );
    }

    user.password = await bcrypt.hash(newPassword, bcryptRounds);
    await this.saveUser(user);

    await this.passResetService.deletePassResetCode(code);
  }

  async changePassword(email: string, password: string, newPassword: string) {
    const user = await this.userRepository.findOneBy({ email });
    if (!user) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'UserExceptions',
        UserExceptions.UserNotFound,
      );
    }
    const compareResult = await bcrypt.compare(password, user.password);
    if (!compareResult) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'AuthExceptions',
        AuthExceptions.WrongPassword,
      );
    }
    user.password = await bcrypt.hash(newPassword, bcryptRounds);
    await this.saveUser(user);
  }

  async changeEmail(changeEmailDto: ChangeEmailDto) {
    const user = await this.userRepository.findOne({
      where: { email: changeEmailDto.email },
    });
    if (!user) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'UserExceptions',
        UserExceptions.UserNotFound,
      );
    }
    const userWithSameEmail = await this.userRepository.findOne({
      where: { email: changeEmailDto.newEmail },
    });
    if (userWithSameEmail) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'UserExceptions',
        UserExceptions.UserAlreadyExists,
      );
    }
    user.email = changeEmailDto.newEmail;
    await this.saveUser(user);
    //TODO send verifyEmail
  }

  async delete(options: FindOptionsWhere<UserEntity>) {
    await this.userRepository.delete(options);
  }
}
