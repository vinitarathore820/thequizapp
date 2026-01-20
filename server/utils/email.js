const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  let transporter;
  let isTestAccount = false;
  
  // For development/testing with Ethereal
  if (process.env.USE_ETHEREAL === 'true') {
    console.log('Using Ethereal test email service');
    const testAccount = await nodemailer.createTestAccount();
    isTestAccount = true;
    
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  } 
  // For production with real SMTP
  else {
    if (!process.env.SMTP_HOST || !process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
      throw new Error('SMTP configuration is missing. Please check your .env file');
    }
    
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
      },
      // Common settings for better compatibility
      tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false
      }
    });
  }

  // Send mail with defined transport object
  const message = {
    from: `"${process.env.FROM_NAME || 'QuizApp'}" <${process.env.FROM_EMAIL || 'noreply@quizapp.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || options.message // Use HTML version if provided, otherwise use text
  };
  
  console.log('Sending email with options:', {
    to: options.email,
    subject: options.subject,
    from: message.from
  });

  try {
    const info = await transporter.sendMail(message);
    
    if (process.env.NODE_ENV === 'development') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('Email sent! Preview URL: %s', previewUrl);
      console.log('Test Account Credentials:');
      console.log('Username:', info.envelope.from);
      console.log('Password: (check your test account)');
      console.log('IMAP: imap.ethereal.email:993');
      console.log('SMTP: smtp.ethereal.email:587');
    }
    
    return {
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId,
      previewUrl: process.env.NODE_ENV === 'development' ? nodemailer.getTestMessageUrl(info) : null
    };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(`Email could not be sent: ${error.message}`);
  }
};

// Email templates
const emailTemplates = {
  verifyEmail: (name, url) => ({
    subject: 'Verify Your Email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Quiz App, ${name}!</h2>
        <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
        <a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Verify Email
        </a>
        <p>Or copy and paste this link into your browser:</p>
        <p>${url}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
      </div>
    `
  }),
  resetPassword: (name, url) => ({
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hello ${name},</h2>
        <p>You are receiving this email because you (or someone else) has requested to reset your password.</p>
        <p>Please click the button below to reset your password:</p>
        <a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Reset Password
        </a>
        <p>Or copy and paste this link into your browser:</p>
        <p>${url}</p>
        <p>This link will expire in 10 minutes.</p>
        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
      </div>
    `
  })
};

module.exports = { sendEmail, emailTemplates };
