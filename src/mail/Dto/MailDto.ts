import { mailMessages, mailSubjects, MailType } from '@/mail/mail.constants';

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
        this.message = mailMessages.verify.createMessage(link);
        break;

      case 'passwordReset':
        this.subject = mailSubjects.passwordReset;
        this.message = mailMessages.passwordReset.createMessage(link);
        break;

      case 'PasswordResetSuccess':
        this.subject = mailSubjects.PasswordResetSuccess;
        this.message = mailMessages.PasswordResetSuccess.createMessage();
        break;

      case 'ShareFileAccess':
        this.subject = mailSubjects.ShareFileAccess;
        this.message = mailMessages.ShareFileAccess.createMessage(link);
        break;

      default:
        this.subject = 'TEST';
        this.message = `<p>TEST</p>`;
        break;
    }
  }
}
