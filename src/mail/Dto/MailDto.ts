type MailType = 'verify' | 'PWDReset';
export class MailDto {
  mailType: MailType;
  recipient: string;
  subject: string;
  message: string;
  constructor(mailType: MailType, recipient: string, link: string) {
    this.mailType = mailType;
    this.recipient = recipient;
    this.subject =
      mailType == 'verify' ? 'Verify your account' : 'Password reset email';
    this.message =
      mailType == 'verify'
        ? `
           <div>
              <h1>Follow this link to verify your account</h1>
              <a href='${link}'>Activate your account</a>
           </div>       
            `
        : `
           <div>
                <h1>Follow this link to reset your password</h1>
                <a href='${link}'>Reset password</a>
           </div>
            `;
  }
}
