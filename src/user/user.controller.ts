import { UserService } from './user.service';
import { UserPayload } from './userPayload';
import { GetUserRdo } from './rdo/get-user.rdo';
import { Body, Controller, Get, HttpStatus, Put, Query } from '@nestjs/common';
import { ApiException } from '@/common/Exceptions/ApiException';
import { UserExceptions } from '@/common/Exceptions/ExceptionTypes/UserExceptions';
import { ValidateQueryPipe } from '@/common/pipes/validateQuery.pipe';
import { User } from '@/common/decorators/User.decorator';
import { AuthGuard } from '@/common/decorators/authGuard.decorator';
import { IsVerified } from '@/common/decorators/verifyGuard.decorator';
import { MailService } from '@/mail/mail.service';
import { apiServer } from '@/common/configs/config';
import { VerificationService } from '@/auth/verification/verification.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly mailService: MailService,
    private readonly verificationService: VerificationService,
  ) {}

  @IsVerified()
  @AuthGuard()
  @Put('change/password/')
  async changePassword(
    @User() user: UserPayload,
    @Body('password') password: string,
    @Body('newPassword') newPassword: string,
  ) {
    await this.userService.changePassword(user.email, password, newPassword);
  }

  @IsVerified()
  @AuthGuard()
  @Put('change/username')
  async changeUsername(
    @Body('newUsername') newUsername: string,
    @User() user: UserPayload,
  ) {
    await this.userService.changeUsername(user.UUID, newUsername);
  }

  @Put('change/email/')
  @AuthGuard()
  async changeEmail(
    @Body('newEmail') newEmail: string,
    @User() user: UserPayload,
  ) {
    await this.userService.changeEmail({
      property: user.email,
      newProperty: newEmail,
    });

    const link = `${apiServer.url}/auth/verify/${
      (await this.verificationService.createCode(user.UUID)).code
    }`;

    await this.mailService.sendVerifyEmail(newEmail, link);
  }

  //TODO
  // @Delete('delete')
  // @UseGuards(AuthGuard)
  // async deleteUser() {
  // }

  @Get()
  async getUserInfo(
    @Query('by', new ValidateQueryPipe(['email', 'username', 'uuid']))
    userProperty: keyof GetUserRdo,
    @Query('value') propertyValue: string,
  ): Promise<GetUserRdo> {
    const user = await this.userService.findOne({
      where: { [userProperty]: propertyValue },
    });

    if (!user) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'UserExceptions',
        UserExceptions.UserNotFound,
      );
    }

    return this.userService.formatToDto(user);
  }
}
