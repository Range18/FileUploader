import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Redirect,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '@/user/dto/create-user.dto';
import { LoggedUserRdo } from '@/user/rdo/logged-user.rdo';
import { Response } from 'express';
import { Cookies } from '@/common/decorators/cookies.decorator';
import { frontendServer, jwtSettings } from '@/common/configs/config';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registration')
  async registration(
    @Body() user: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoggedUserRdo> {
    const { userRdo, refreshToken } = await this.authService.registration(user);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      expires: new Date(Date.now() + jwtSettings.refreshExpire.ms()),
    });
    return userRdo;
  }

  @Post('login')
  async login(
    @Body() user: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoggedUserRdo> {
    const { userRdo, refreshToken } = await this.authService.login(user);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      expires: new Date(Date.now() + jwtSettings.refreshExpire.ms()),
    });
    return userRdo;
  }

  @Get('verify/:code')
  @Redirect(frontendServer.url)
  async verifyEmail(@Param('code') code: string) {
    await this.authService.verify(code);
  }

  @Delete('logout')
  async logout(
    @Cookies('refreshToken') refreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(refreshToken);
    res.clearCookie('refreshToken');
  }

  @Post('refresh')
  async refresh(
    @Cookies('refreshToken') OldRefreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoggedUserRdo | null> {
    const { userRdo, refreshToken } = await this.authService.refresh(
      OldRefreshToken,
    );
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      expires: new Date(Date.now() + jwtSettings.refreshExpire.ms()),
    });
    return userRdo;
  }
}
