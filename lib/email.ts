/**
 * Email Service
 * Handles sending transactional emails using nodemailer
 * In production, consider using Resend, SendGrid, or AWS SES
 */

import nodemailer from 'nodemailer';

// Email configuration
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@investment-advisor.com';
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

// Create transporter (will be lazily initialized)
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    // For development, use ethereal.email or test account
    if (process.env.NODE_ENV === 'development' && !SMTP_HOST) {
      // Create test account for development
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: 'test@ethereal.email',
          pass: 'test',
        },
      });
      console.log('[Email] Using test email service (emails will not be sent)');
    } else {
      // Use configured SMTP
      transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });
    }
  }
  return transporter;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email
 */
export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
  try {
    const mailOptions = {
      from: EMAIL_FROM,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    // In development without SMTP, just log the email
    if (process.env.NODE_ENV === 'development' && !SMTP_HOST) {
      console.log('[Email] Development mode - Email would be sent:');
      console.log(JSON.stringify(mailOptions, null, 2));
      return true;
    }

    const transporter = getTransporter();
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send email:', error);
    return false;
  }
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
  const verifyUrl = `${BASE_URL}/auth/verify-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          .code { background: #e5e7eb; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Investment Advisor</h1>
          </div>
          <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Thank you for signing up for Investment Advisor! Please verify your email address by clicking the button below:</p>
            <center><a href="${verifyUrl}" class="button">Verify Email</a></center>
            <p>Or copy and paste this link into your browser:</p>
            <p class="code">${verifyUrl}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Investment Advisor. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    Verify Your Email Address
    =========================

    Thank you for signing up for Investment Advisor!

    Please verify your email address by visiting this link:
    ${verifyUrl}

    This link will expire in 24 hours.

    If you didn't create an account, you can safely ignore this email.

    © ${new Date().getFullYear()} Investment Advisor. All rights reserved.
  `;

  return sendEmail({ to: email, subject: 'Verify Your Email Address', html, text });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
  const resetUrl = `${BASE_URL}/auth/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Investment Advisor</h1>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <center><a href="${resetUrl}" class="button">Reset Password</a></center>
            <p>Or copy and paste this link into your browser:</p>
            <p class="code">${resetUrl}</p>
            <div class="warning">
              <strong>Important:</strong> This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Investment Advisor. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    Reset Your Password
    ===================

    We received a request to reset your password.

    Click the link below to create a new password:
    ${resetUrl}

    This link will expire in 1 hour.

    If you didn't request a password reset, you can safely ignore this email.

    © ${new Date().getFullYear()} Investment Advisor. All rights reserved.
  `;

  return sendEmail({ to: email, subject: 'Reset Your Password', html, text });
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(email: string, name?: string): Promise<boolean> {
  const displayName = name || email.split('@')[0];

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Investment Advisor</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .features { text-align: left; margin: 20px 0; }
          .features li { margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Investment Advisor!</h1>
          </div>
          <div class="content">
            <p>Hi ${displayName},</p>
            <p>Welcome to Investment Advisor! We're excited to have you on board. Your account has been successfully created and verified.</p>
            <p>Here's what you can do with your account:</p>
            <ul class="features">
              <li>📊 Track your investment portfolio</li>
              <li>⭐ Create watchlists for your favorite assets</li>
              <li>📈 View real-time prices and charts</li>
              <li>💰 Analyze gold, silver, stocks, and crypto</li>
              <li>🔮 Get AI-powered price predictions</li>
            </ul>
            <center><a href="${BASE_URL}/dashboard" class="button">Go to Dashboard</a></center>
            <p style="margin-top: 30px;">If you have any questions, feel free to reach out to our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Investment Advisor. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    Welcome to Investment Advisor!
    ==============================

    Hi ${displayName},

    Welcome to Investment Advisor! We're excited to have you on board.

    Here's what you can do with your account:
    - Track your investment portfolio
    - Create watchlists for your favorite assets
    - View real-time prices and charts
    - Analyze gold, silver, stocks, and crypto
    - Get AI-powered price predictions

    Visit your dashboard: ${BASE_URL}/dashboard

    © ${new Date().getFullYear()} Investment Advisor. All rights reserved.
  `;

  return sendEmail({ to: email, subject: 'Welcome to Investment Advisor!', html, text });
}
