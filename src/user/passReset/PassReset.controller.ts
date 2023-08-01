import { Body, Controller, Param, Post, Put } from '@nestjs/common';
import { PassResetService } from '@/user/passReset/passReset.service';
import { MailService } from '@/mail/mail.service';

@Controller()
export class PassResetController {
  constructor(
    private readonly passResetService: PassResetService,
    private readonly mailService: MailService,
  ) {}
  @Put('reset/password/:code')
  async resetPassword(
    @Param('code') code: string,
    @Body('password') password: string,
  ) {
    await this.passResetService.resetPassword(code, password);
  }

  @Post('send/resetPass')
  async sendResetPass(@Body('email') email: string) {
    const { code } = await this.passResetService.createPassResetCode(email);
    await this.mailService.sendPassResetEmail(email, code);
  }
}
