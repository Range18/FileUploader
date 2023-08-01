import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { FindOptionsWhere, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiException } from '@/common/Exceptions/ApiException';
import { UserExceptions } from '@/common/Exceptions/ExceptionTypes/UserExceptions';
import * as bcrypt from 'bcrypt';
import { bcryptRounds } from '@/common/configs/config';
import { AuthExceptions } from '@/common/Exceptions/ExceptionTypes/AuthExceptions';
import { updateUserDto } from '@/user/dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
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
    await this.saveUser(user);
  }

  async delete(options: FindOptionsWhere<UserEntity>) {
    await this.userRepository.delete(options);
  }
}
