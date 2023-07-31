import { smtpSettings } from '@/common/configs/smtpConfig';

export type MailType =
  | 'verify'
  | 'passwordReset'
  | 'PasswordResetSuccess'
  | 'ShareFileAccess';

type MailSubjects = {
  [key in MailType]: string;
};

type MailMessages = {
  [key in MailType]: { createMessage(link?: string): string };
};
export const SUPPORT_EMAIL_ADDRESS = smtpSettings.auth.user;
export const mailSubjects: Readonly<MailSubjects> = {
  verify: 'Verify your account',
  passwordReset: 'Password reset email',
  PasswordResetSuccess: 'Password changed successfully',
  ShareFileAccess: 'You were invited to access a file',
};

export const mailMessages: Readonly<MailMessages> = {
  verify: {
    createMessage(link: string) {
      return `
           <div>
              <h1>Follow this link to verify your account</h1>
              <a href='${link}'>Activate your account</a>
           </div>       
            `;
    },
  },
  passwordReset: {
    createMessage(link: string) {
      return `
           <div>
                <h1>Follow this link to reset your password</h1>
                <a href='${link}'>Reset password</a>
           </div>
            `;
    },
  },
  PasswordResetSuccess: {
    createMessage() {
      return `
           <div>
              <h1>Your password succesfully changed</h1>
              <div>If it was not you, you must tell that to out oficial support</div>
              <a href='${SUPPORT_EMAIL_ADDRESS}'>Our support</a>
           </div>
            `;
    },
  },

  ShareFileAccess: {
    createMessage(link?: string): string {
      return `
           <div>
              <h1>You got invited to access file</h1>
              <div>Just tap that link to get access</div>
              <a href='${link}'>Access file</a>
           </div>
            `;
    },
  },
};
