import { MailService } from '@sendgrid/mail';

// Initialize SendGrid with API key
if (!process.env.SENDGRID_API_KEY) {
  console.error('SENDGRID_API_KEY environment variable is not set. Cannot run test.');
  process.exit(1);
}

console.log('SENDGRID_API_KEY is set. Attempting to send test email...');

// Use the key from environment variables
const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

// Get sender from environment or use default
const VERIFIED_SENDER = process.env.VERIFIED_SENDER || 'Benny@lauraandbennyphotography.com';
console.log(`Using sender email: ${VERIFIED_SENDER}`);

// Target recipient - can be overridden with TARGET_EMAIL env var
const targetEmail = process.env.TARGET_EMAIL || 'test@example.com';

async function testSendGrid() {
  try {
    console.log(`Attempting to send email to: ${targetEmail}`);
    
    const msg = {
      to: targetEmail,
      from: VERIFIED_SENDER,
      subject: 'SendGrid Test from Wedding Day Timeline',
      text: 'This is a test email sent via SendGrid API to verify your integration is working.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">SendGrid Test</h2>
          <p>This is a test email sent via SendGrid API to verify your integration is working.</p>
          <p>If you received this email, your SendGrid configuration is correct!</p>
          <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee;">
            <p>Wedding Day Timeline Application</p>
          </div>
        </div>
      `,
    };
    
    const response = await mailService.send(msg);
    console.log('Email sent successfully with status code:', response[0].statusCode);
    console.log('Headers:', response[0].headers);
    return true;
  } catch (error: any) {
    console.error('SendGrid email error:', error);
    
    // More detailed error logging
    if (error.response) {
      console.error('SendGrid error response:', {
        status: error.response.status,
        body: error.response.body,
        headers: error.response.headers
      });
      
      // Additional specific error information
      if (error.response.body && error.response.body.errors && error.response.body.errors.length > 0) {
        console.error('SendGrid specific errors:', JSON.stringify(error.response.body.errors, null, 2));
      }
    }
    
    return false;
  }
}

// Run the test
testSendGrid()
  .then(result => {
    if (result) {
      console.log('✅ SendGrid test completed successfully!');
    } else {
      console.log('❌ SendGrid test failed. Check the error logs above.');
    }
    process.exit(result ? 0 : 1);
  });