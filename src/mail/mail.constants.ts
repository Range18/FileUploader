import { MailType } from '@/mail/Dto/MailDto';
import { smtpSettings } from '@/common/configs/smtpConfig';

type MailSubjects = {
  [key in MailType]: string;
};

type MailMessages = {
  [key in string]: (link?: string) => string;
};
export const SUPPORT_EMAIL_ADDRESS = smtpSettings.auth.user;
export const mailSubjects: Readonly<MailSubjects> = {
  verify: 'Verify your account',
  passwordReset: 'Password reset email',
  PasswordResetSuccess: 'Password changed successfully',
};

export const mailMessages: Readonly<MailMessages> = {
  CreateVerify: (link: string) => `
           <div>
              <h1>Follow this link to verify your account</h1>
              <a href='${link}'>Activate your account</a>
           </div>       
            `,
  CreatePasswordReset: (link: string) => `
           <div>
                <h1>Follow this link to reset your password</h1>
                <a href='${link}'>Reset password</a>
           </div>
            `,
  CreatePasswordResetSuccess: () => `
           <div>
              <h1>Your password succesfully changed</h1>
              <div>If it was not you, you must tell that to out oficial support</div>
              <a href='${SUPPORT_EMAIL_ADDRESS}'>Our support</a>
           </div>
            `,
};
