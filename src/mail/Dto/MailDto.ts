import { mailMessages, mailSubjects } from '@/mail/mail.constants';

export type MailType = 'verify' | 'passwordReset' | 'PasswordResetSuccess';

export class MailDto {
  mailType: MailType;
  recipient: string;
  subject: string;
  message: string;
  //TODO link null if PasswordResetSuccess mailType
  constructor(mailType: MailType, recipient: string, link: string) {
    this.mailType = mailType;
    this.recipient = recipient;

    switch (this.mailType) {
      case 'verify':
        this.subject = mailSubjects.verify;
        this.message = mailMessages.Createverify(link);
        break;
      case 'passwordReset':
        this.subject = mailSubjects.passwordReset;
        this.message = mailMessages.CreatepasswordReset(link);
        break;
      case 'PasswordResetSuccess':
        this.subject = mailSubjects.PasswordResetSuccess;
        this.message = mailMessages.CreatePasswordResetSuccess();
        break;
      default:
        this.subject = 'TEST';
        this.message = `<p>TEST</p>`;
        break;
    }
  }
}
