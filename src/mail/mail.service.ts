import { MailDto } from './Dto/MailDto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { smtpSettings } from '@/common/configs/smtpConfig';
import { apiServer, frontendServer } from '@/common/configs/config';
import { createTransport, Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly transporter: Transporter;

  constructor() {
    this.transporter = createTransport(smtpSettings);
  }

  private async sendEMail(mailDto: MailDto) {
    await this.transporter
      .sendMail({
        from: smtpSettings.auth.user,
        to: mailDto.recipient,
        subject: mailDto.subject,
        text: '',
        html: mailDto.message,
      })
      .catch((err) => {
        throw new BadRequestException(err['code'], { cause: err['response'] });
      });
  }

  async sendVerifyEmail(recipient: string, link: string) {
    await this.sendEMail(new MailDto('verify', recipient, link));
  }

  async sendPassResetEmail(recipient: string, code: string) {
    await this.sendEMail(
      new MailDto(
        'passwordReset',
        recipient,
        `${frontendServer.url}/user/change/password/${code}`,
      ),
    );
  }

  async sendSharingFileEmail(recipient: string, link: string) {
    await this.sendEMail(
      new MailDto(
        'ShareFileAccess',
        recipient,
        `${apiServer.url}/drive/set/permissions/${link}`,
      ),
    );
  }
}
