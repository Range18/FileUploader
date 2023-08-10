import { UserEntity } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiException } from '@/common/Exceptions/ApiException';
import { UserExceptions } from '@/common/Exceptions/ExceptionTypes/UserExceptions';
import { bcryptRounds } from '@/common/configs/config';
import { AuthExceptions } from '@/common/Exceptions/ExceptionTypes/AuthExceptions';
import { updateUserDto } from '@/user/dto/update-user.dto';
import { BaseEntityService } from '@/common/base-entity.service';
import { GetUserRdo } from '@/user/rdo/get-user.rdo';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

@Injectable()
export class UserService extends BaseEntityService<UserEntity, GetUserRdo> {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {
    super(userRepository, GetUserRdo);
  }

  async findByUUID(UUID: string): Promise<UserEntity | null> {
    return await this.userRepository.findOne({
      where: { UUID },
    });
  }

  // Methods to create user
  async createAndSave(user: CreateUserDto | UserEntity) {
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

    const sameUsernameUser = await this.findOne({
      where: { username: newUsername },
    });

    if (sameUsernameUser) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'UserExceptions',
        UserExceptions.UserAlreadyExists,
      );
    }

    user.username = newUsername;
    await this.createAndSave(user);
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
    await this.createAndSave(user);
  }

  async changeEmail(changeEmailDto: updateUserDto) {
    const user = await this.userRepository.findOne({
      where: { email: changeEmailDto.property },
    });

    if (!user) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'UserExceptions',
        UserExceptions.UserNotFound,
      );
    }

    const userWithSameEmail = await this.userRepository.findOne({
      where: { email: changeEmailDto.newProperty },
    });

    if (userWithSameEmail) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'UserExceptions',
        UserExceptions.UserAlreadyExists,
      );
    }

    user.email = changeEmailDto.newProperty;
    await this.createAndSave(user);
  }
}
