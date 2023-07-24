import { Body, Controller, Post } from '@nestjs/common';
import { MailService } from './mail.service';

@Controller('send')
export class MailController {
  constructor(private readonly mailService: MailService) {}
  @Post('resetPass')
  async sendResetPass(@Body('email') email: string) {
    await this.mailService.sendPassResetEmail(email);
  }
}
