import { MailService } from '@sendgrid/mail';

// Initialize SendGrid with API key
if (!process.env.SENDGRID_API_KEY) {
  console.warn('SENDGRID_API_KEY environment variable is not set. Email functionality will not work.');
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY || '');

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Send an email using SendGrid
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const msg = {
      to: options.to,
      from: 'noreply@lauraandbennyphotography.com', // Use your verified sender
      subject: options.subject,
      text: options.text || '',
      html: options.html || '',
    };
    
    await mailService.send(msg);
    return true;
  } catch (error) {
    console.error('SendGrid error:', error);
    return false;
  }
}

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  resetUrl: string
): Promise<boolean> {
  const subject = 'Reset Your Wedding Day Timeline Password';
  const resetLink = `${resetUrl}?token=${resetToken}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; margin-bottom: 20px;">Reset Your Password</h2>
      <p>Hello,</p>
      <p>We received a request to reset your password for the Wedding Day Timeline application.</p>
      <p>To reset your password, please click the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" 
           style="background-color: #4f46e5; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 4px; font-weight: bold;">
          Reset Password
        </a>
      </div>
      <p>If you didn't request this password reset, you can safely ignore this email.</p>
      <p>This link will expire in 1 hour for security reasons.</p>
      <p>Thank you,<br>The Wedding Day Timeline Team</p>
    </div>
  `;
  
  const text = `
    Reset Your Password
    
    Hello,
    
    We received a request to reset your password for the Wedding Day Timeline application.
    
    To reset your password, please visit the following link:
    ${resetLink}
    
    If you didn't request this password reset, you can safely ignore this email.
    
    This link will expire in 1 hour for security reasons.
    
    Thank you,
    The Wedding Day Timeline Team
  `;
  
  return sendEmail({
    to: email,
    subject,
    html,
    text,
  });
}