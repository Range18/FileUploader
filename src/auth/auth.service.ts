import { VerificationService } from './verification/verification.service';
import { LoginDto } from './dto/login.dto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from '@/user/dto/create-user.dto';
import { UserService } from '@/user/user.service';
import { LoggedUserRdo } from '@/user/rdo/logged-user.rdo';
import { SessionService } from '@/session/session.service';
import { ApiException } from '@/common/Exceptions/ApiException';
import { UserExceptions } from '@/common/Exceptions/ExceptionTypes/UserExceptions';
import { apiServer, bcryptRounds } from '@/common/configs/config';
import { MailService } from '@/mail/mail.service';

import { TokenExceptions } from '@/common/Exceptions/ExceptionTypes/TokenExceptions';
import { AuthExceptions } from '@/common/Exceptions/ExceptionTypes/AuthExceptions';
import { SessionExceptions } from '@/common/Exceptions/ExceptionTypes/SessionExceptions';
import { StorageService } from '@/storage/storage.service';
import { CreateSession } from '@/common/types/createSession';
import { isEmail } from 'class-validator';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    private readonly mailService: MailService,
    private readonly verificationService: VerificationService,
    private readonly storageService: StorageService,
  ) {}

  async registration(
    createUserDto: CreateUserDto,
  ): Promise<{ userRdo: LoggedUserRdo; refreshToken: string }> {
    const user =
      (await this.userService.findOneByEmail(createUserDto.email)) ??
      (await this.userService.findOneByUsername(createUserDto.username));
    if (user) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        'UserExceptions',
        UserExceptions.UserAlreadyExists,
      );
    }

    createUserDto.password = await bcrypt.hash(
      createUserDto.password,
      bcryptRounds,
    );
    const userEntity = await this.userService.saveUser(createUserDto);
    const payload: CreateSession = {
      UUID: userEntity.UUID,
      email: userEntity.email,
      username: userEntity.username,
    };

    const link = `${apiServer.url}/auth/verify/${
      (await this.verificationService.createCode(userEntity.UUID)).code
    }`;

    this.mailService.sendVerifyEmail(createUserDto.email, link);
    this.storageService.createDefaultStorage(userEntity);
    const sessionData = await this.sessionService.saveSession(payload);
    return {
      userRdo: sessionData.userRdo,
      refreshToken: sessionData.refreshToken,
    };
  }

  async login(
    userData: LoginDto,
  ): Promise<{ userRdo: LoggedUserRdo; refreshToken: string }> {
    const user = isEmail(userData.login)
      ? await this.userService.findOneByEmail(userData.login)
      : await this.userService.findOneByUsername(userData.login);
    if (!user) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'UserExceptions',
        UserExceptions.UserNotFound,
      );
    }

    const compareResult = await bcrypt.compare(
      userData.password,
      user.password,
    );
    if (!compareResult) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'AuthExceptions',
        AuthExceptions.WrongPassword,
      );
    }
    const payload: CreateSession = {
      UUID: user.UUID,
      email: user.email,
      username: user.username,
    };
    const sessionData = await this.sessionService.saveSession(payload);

    return {
      userRdo: sessionData.userRdo,
      refreshToken: sessionData.refreshToken,
    };
  }

  async logout(refreshToken: string) {
    const token = await this.sessionService.getUserFromToken(refreshToken);
    await this.sessionService.removeSession(token.sessionUUID);
  }

  async verify(code: string) {
    const verificationRecord = await this.verificationService.findByCode(code);
    if (!verificationRecord) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'TokenExceptions',
        TokenExceptions.InvalidToken,
      );
    }

    const user = await this.userService.findByUUID(verificationRecord.userUUID);
    if (!user) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'UserExceptions',
        UserExceptions.UserNotFound,
      );
    }

    user.isVerified = true;
    await this.userService.saveUser(user);
    await this.verificationService.deleteCode(code);
  }

  async refresh(
    refreshToken: string,
  ): Promise<{ userRdo: LoggedUserRdo; refreshToken: string }> {
    const userData = await this.sessionService.getUserFromToken(refreshToken);

    const session = await this.sessionService.findOneByUUID(
      userData.sessionUUID,
    );
    if (!session) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        'SessionExceptions',
        SessionExceptions.SessionNotFound,
      );
    }
    const user = await this.userService.findByUUID(userData.UUID);
    if (!user) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'UserExceptions',
        UserExceptions.UserNotFound,
      );
    }
    const userPayload: CreateSession = {
      UUID: user.UUID,
      email: user.email,
      username: user.username,
    };
    const newSession = await this.sessionService.saveSession(userPayload);
    await this.sessionService.removeSession(session.sessionUUID);
    return newSession;
  }
}
