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
import { CreateSession } from '@/session/createSession';
import { TokenService } from '@/token/token.service';
import { UserPayload } from '@/user/userPayload';
import { BrowserInfo } from '@/session/browser-info';
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
    private readonly tokenService: TokenService,
  ) {}

  async registration(
    createUserDto: CreateUserDto,
    sessionInfo: BrowserInfo,
  ): Promise<{ userRdo: LoggedUserRdo; refreshToken: string }> {
    const user =
      (await this.userService.findOne({
        where: { email: createUserDto.email },
      })) ??
      (await this.userService.findOne({
        where: { username: createUserDto.username },
      }));

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

    const userEntity = await this.userService.createAndSave(createUserDto);

    const payload: CreateSession = {
      UUID: userEntity.UUID,
      email: userEntity.email,
      username: userEntity.username,
    };

    const link = `${apiServer.url}/auth/verify/${
      (await this.verificationService.createCode(userEntity.UUID)).code
    }`;

    await this.mailService.sendVerifyEmail(createUserDto.email, link);
    this.storageService.createDefaultStorage(userEntity);

    const sessionData = await this.sessionService.saveSession(
      payload,
      sessionInfo,
    );

    return {
      userRdo: sessionData.userRdo,
      refreshToken: sessionData.refreshToken,
    };
  }

  async login(
    userData: LoginDto,
    sessionInfo: BrowserInfo,
  ): Promise<{ userRdo: LoggedUserRdo; refreshToken: string }> {
    const user = isEmail(userData.login)
      ? await this.userService.findOne({ where: { email: userData.login } })
      : await this.userService.findOne({ where: { username: userData.login } });
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
    const sessionData = await this.sessionService.saveSession(
      payload,
      sessionInfo,
    );

    return {
      userRdo: sessionData.userRdo,
      refreshToken: sessionData.refreshToken,
    };
  }

  async logout(refreshToken: string) {
    const token = await this.tokenService.validateToken<UserPayload>(
      refreshToken,
    );
    await this.sessionService.removeOne({
      where: { sessionUUID: token.sessionUUID },
    });
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
    await this.userService.createAndSave(user);
    await this.verificationService.deleteCode(code);
  }

  async refresh(
    refreshToken: string,
    sessionInfo: BrowserInfo,
  ): Promise<{ userRdo: LoggedUserRdo; refreshToken: string }> {
    if (!refreshToken) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        'AuthExceptions',
        AuthExceptions.RefreshTokenRequired,
      );
    }

    const userData = await this.tokenService.validateToken<UserPayload>(
      refreshToken,
    );

    const session = await this.sessionService.findOne({
      where: { sessionUUID: userData.sessionUUID },
    });

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
    await this.sessionService.removeOne({
      where: { sessionUUID: session.sessionUUID },
    });

    return await this.sessionService.saveSession(userPayload, sessionInfo);
  }
}
