import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Put,
  Query,
} from '@nestjs/common';
import { PassResetService } from './passReset/passReset.service';
import { UserService } from './user.service';
import { ApiException } from '@/common/Exceptions/ApiException';
import { UserExceptions } from '@/common/Exceptions/ExceptionTypes/UserExceptions';
import { ValidateQueryPipe } from '@/common/pipes/validateQuery.pipe';
import { User } from '@/common/decorators/User.decorator';
import { UserPayload } from './interfaces/userPayload';
import { AuthGuard } from '@/common/decorators/authGuard.decorator';
import { IsVerified } from '@/common/decorators/verifyGuard.decorator';
import { GetUserDto } from './dto/get-user.dto';

@Controller('user')
export class UserController {
  constructor(
    private passResetService: PassResetService,
    private userService: UserService,
  ) {}

  @Put('reset/password/:code')
  async resetPassword(
    @Param('code') code: string,
    @Body('password') password: string,
  ) {
    await this.userService.resetPassword(code, password);
  }

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
  //TODO
  @Put('change/email/')
  @AuthGuard()
  async changeEmail(
    @Body('newEmail') newEmail: string,
    @User() user: UserPayload,
  ) {
    await this.userService.changeEmail({
      email: user.email,
      newEmail: newEmail,
    });
  }

  //TODO
  // @Delete('delete')
  // @UseGuards(AuthGuard)
  // async deleteUser() {
  // }

  /*TODO
    @Post('download/data')
    @UseGuards(AuthGuard,VerificationGuard)
    async downloadUserData() {
    }
    */

  @Get()
  async getUserInfo(
    @Query('by', new ValidateQueryPipe(['email', 'username', 'uuid']))
    userProperty: keyof GetUserDto,
    @Query('value') propertyValue: string,
  ): Promise<GetUserDto> {
    const user = await this.userService.findOne(userProperty, propertyValue);
    if (!user) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'UserExceptions',
        UserExceptions.UserNotFound,
      );
    }
    return {
      username: user.username,
      email: user.email,
      UUID: user.UUID,
    };
  }
}
