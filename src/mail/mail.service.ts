import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import { MailDto } from './Dto/MailDto';
import { smtpSettings } from '@/common/configs/smtpConfig';
import { ApiException } from '@/common/Exceptions/ApiException';
import { UserExceptions } from '@/common/Exceptions/ExceptionTypes/UserExceptions';
import { UserService } from '@/user/user.service';
import { PassResetService } from '@/user/passReset/passReset.service';
import { frontendServer } from '@/common/configs/config';

@Injectable()
export class MailService {
  private readonly transporter: Transporter;

  constructor(
    private readonly userService: UserService,
    private readonly passResetService: PassResetService,
  ) {
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
      .catch(async (err) => {
        console.log(err);
        await this.userService.delete({ email: mailDto.recipient });
        throw new BadRequestException(err, { cause: err });
      });
  }

  async sendVerifyEmail(recipient: string, link: string) {
    await this.sendEMail(new MailDto('verify', recipient, link));
  }

  async sendPassResetEmail(recipient: string) {
    const user = await this.userService.findOneByEmail(recipient);
    if (!user) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'UserExceptions',
        UserExceptions.UserNotFound,
      );
    }
    const code = (await this.passResetService.createPassResetCode(user.UUID))
      .code;
    await this.sendEMail(
      new MailDto(
        'passwordReset',
        recipient,
        `${frontendServer.url}/user/change/password/${code}`,
      ),
    );
  }
}
