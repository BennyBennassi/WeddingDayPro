import { MailService } from '@sendgrid/mail';

// Initialize SendGrid with API key
if (!process.env.SENDGRID_API_KEY) {
  console.warn('SENDGRID_API_KEY environment variable is not set. Email functionality will not work.');
}

// This should be a verified sender in your SendGrid account
// We need to use an email that has been verified with SendGrid
const VERIFIED_SENDER = 'Benny@lauraandbennyphotography.com';

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
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SendGrid API key is not set. Cannot send email.');
    return false;
  }

  try {
    console.log(`Attempting to send email to: ${options.to}`);
    
    const msg = {
      to: options.to,
      from: VERIFIED_SENDER,
      subject: options.subject,
      text: options.text || '',
      html: options.html || '',
    };
    
    const response = await mailService.send(msg);
    console.log('Email sent successfully:', response[0].statusCode);
    return true;
  } catch (error: any) {
    console.error('SendGrid error:', error);
    
    // More detailed error logging
    if (error.response) {
      console.error('SendGrid error response:', {
        status: error.response.status,
        body: error.response.body,
        headers: error.response.headers
      });
      
      // Additional specific error information
      if (error.response.body && error.response.body.errors && error.response.body.errors.length > 0) {
        console.error('SendGrid specific error:', JSON.stringify(error.response.body.errors, null, 2));
      }
    }
    
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
  console.log(`Preparing password reset email for ${email} with token length: ${resetToken.length}`);
  console.log(`Reset URL base: ${resetUrl}`);
  
  const subject = 'Reset Your Wedding Day Timeline Password';
  const resetLink = `${resetUrl}?token=${resetToken}`;
  
  console.log(`Complete reset link: ${resetLink}`);
  
  // HTML with fallback in case button doesn't render
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; line-height: 1.6; color: #333; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #4f46e5; margin-bottom: 5px; font-size: 24px;">Wedding Day Timeline</h1>
          <h2 style="color: #333; margin-top: 0; font-size: 22px;">Password Reset</h2>
        </div>
        
        <p style="margin-bottom: 15px;">Hello,</p>
        
        <p style="margin-bottom: 15px;">We received a request to reset your password for the Wedding Day Timeline application.</p>
        
        <p style="margin-bottom: 15px;">To reset your password, please click the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #4f46e5; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p style="margin-bottom: 5px;">If the button above doesn't work, copy and paste this link into your browser:</p>
        <p style="margin-bottom: 20px; background-color: #f5f5f5; padding: 10px; word-break: break-all; font-size: 14px;">
          ${resetLink}
        </p>
        
        <p style="margin-bottom: 15px;">If you didn't request this password reset, you can safely ignore this email.</p>
        
        <p style="margin-bottom: 15px;">This link will expire in 1 hour for security reasons.</p>
        
        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; font-size: 14px; color: #666;">
          <p style="margin: 0;">Thank you,<br>The Wedding Day Timeline Team</p>
        </div>
      </div>
    </body>
    </html>
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
  
  try {
    const result = await sendEmail({
      to: email,
      subject,
      html,
      text,
    });
    
    console.log(`Password reset email send attempt result: ${result}`);
    return result;
  } catch (error) {
    console.error('Error in sendPasswordResetEmail:', error);
    return false;
  }
}