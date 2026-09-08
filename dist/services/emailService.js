"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const resend_1 = require("resend");
class EmailService {
    constructor() {
        if (!process.env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY environment variable is not set.');
        }
        this.resend = new resend_1.Resend(process.env.RESEND_API_KEY);
    }
    async sendEmail(options) {
        try {
            const { error } = await this.resend.emails.send({
                from: `${process.env.EMAIL_FROM_NAME || 'Crown Ledger'} <${process.env.EMAIL_FROM_ADDRESS || 'onboarding@resend.dev'}>`,
                to: options.to,
                subject: options.subject,
                html: options.html,
            });
            if (error) {
                throw new Error(error.message);
            }
            console.log(`[EMAIL] Email sent to ${options.to}`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('[EMAIL] Error sending email:', errorMessage);
            throw error;
        }
    }
    logoHeaderHtml() {
        return `
      <table class="logo-table" role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
        <tr>
          <td>
            <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/crown-5qzJ7RGtUeUieMErT9XJBV7XaVcLJV.png" alt="Crown Ledger" class="logo-img">
          </td>
          <td class="logo-text-cell">
            <div class="logo-text">Crown <span class="brand">Ledger</span></div>
          </td>
        </tr>
      </table>
    `;
    }
    logoHeaderStyles() {
        return `
      .logo-table { margin: 0 auto 20px auto; border-collapse: collapse; }
      .logo-table td { vertical-align: left; padding: 0; }
      .logo-img { width: 44px; height: 44px; display: block; padding: 12px;}
      .logo-text-cell { padding-left: 14px; }
      .logo-text { font-size: 18px; font-weight: 800; color: #111827; white-space: nowrap; }
      .logo-text .brand { color: #FA510F; }
    `;
    }
    generateVerificationEmailHtml(fullName, verificationLink) {
        return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'DM Sans', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg,#F8F9FC 0%,#EEF2FF 100%); }
            .email-body { background-color: #ffffff; padding: 30px; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
            .header { text-align: center; margin-bottom: 30px; }
            ${this.logoHeaderStyles()}
            .content { margin-bottom: 30px; }
            .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #FA510F 0%, #D94309 100%); color: #ffffff; text-decoration: none; border-radius: 10px; margin: 20px 0; font-weight: 600; box-shadow: 0 4px 12px rgba(250,81,15,0.3); }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
            .warning { color: #D94309; font-size: 12px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="email-body">
              <div class="header">
                ${this.logoHeaderHtml()}
              </div>
              <div class="content">
                <h2>Welcome, ${fullName}!</h2>
                <p>Thank you for signing up with Crown Ledger. To complete your registration and verify your email address, please click the button below:</p>
                <a href="${verificationLink}" class="button">Verify Email Address</a>
                <p style="color: #666; font-size: 14px;">Or copy and paste this link in your browser:</p>
                <p style="word-break: break-all; color: #FA510F;">${verificationLink}</p>
                <p class="warning">⚠️ This link will expire in 24 hours. If you didn't create this account, please ignore this email.</p>
              </div>
              <div class="footer">
                <p>&copy; 2026 Crown Ledger. All rights reserved.</p>
                <p>This is an automated email. Please do not reply.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    }
    generatePasswordResetEmailHtml(fullName, resetLink) {
        return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'DM Sans', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg,#F8F9FC 0%,#EEF2FF 100%); }
            .email-body { background-color: #ffffff; padding: 30px; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
            .header { text-align: center; margin-bottom: 30px; }
            ${this.logoHeaderStyles()}
            .content { margin-bottom: 30px; }
            .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #FA510F 0%, #D94309 100%); color: #ffffff; text-decoration: none; border-radius: 10px; margin: 20px 0; font-weight: 600; box-shadow: 0 4px 12px rgba(250,81,15,0.3); }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
            .warning { color: #D94309; font-size: 12px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="email-body">
              <div class="header">
                ${this.logoHeaderHtml()}
              </div>
              <div class="content">
                <h2>Password Reset Request</h2>
                <p>Hi ${fullName},</p>
                <p>We received a request to reset your password. Click the button below to create a new password:</p>
                <a href="${resetLink}" class="button">Reset Password</a>
                <p style="color: #666; font-size: 14px;">Or copy and paste this link in your browser:</p>
                <p style="word-break: break-all; color: #FA510F;">${resetLink}</p>
                <p class="warning">⚠️ This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your account will remain secure.</p>
              </div>
              <div class="footer">
                <p>&copy; 2026 Crown Ledger. All rights reserved.</p>
                <p>This is an automated email. Please do not reply.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    }
    generateWelcomeEmailHtml(fullName) {
        return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'DM Sans', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg,#F8F9FC 0%,#EEF2FF 100%); }
            .email-body { background-color: #ffffff; padding: 30px; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
            .header { text-align: center; margin-bottom: 30px; }
            ${this.logoHeaderStyles()}
            .content { margin-bottom: 30px; }
            .feature-list { list-style: none; padding: 0; }
            .feature-list li { padding: 10px 0; padding-left: 28px; position: relative; color: #374151; }
            .feature-list li:before { content: "✓"; position: absolute; left: 0; color: #FA510F; font-weight: bold; font-size: 16px; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="email-body">
              <div class="header">
                ${this.logoHeaderHtml()}
              </div>
              <div class="content">
                <h2>Welcome to Crown Ledger, ${fullName}!</h2>
                <p>Your account has been successfully created and verified. You're now ready to explore all the features we have to offer.</p>
                <h3>What You Can Do:</h3>
                <ul class="feature-list">
                  <li>Manage multiple account types</li>
                  <li>Track your savings and investments</li>
                  <li>Make secure transactions</li>
                  <li>Access your account 24/7</li>
                  <li>Enjoy premium banking features</li>
                </ul>
                <p>If you have any questions or need assistance, our support team is here to help you.</p>
              </div>
              <div class="footer">
                <p>&copy; 2026 Crown Ledger. All rights reserved.</p>
                <p>This is an automated email. Please do not reply.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    }
    generateLoginNotificationEmailHtml(fullName) {
        return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'DM Sans', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg,#F8F9FC 0%,#EEF2FF 100%); }
            .email-body { background-color: #ffffff; padding: 30px; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
            .header { text-align: center; margin-bottom: 30px; }
            ${this.logoHeaderStyles()}
            .content { margin-bottom: 30px; }
            .alert-box { background-color: #FFF4F0; border-left: 4px solid #FA510F; padding: 15px; margin: 20px 0; border-radius: 8px; }
            .alert-box p { color: #6B4423; margin: 8px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="email-body">
              <div class="header">
                ${this.logoHeaderHtml()}
              </div>
              <div class="content">
                <h2>Login Notification</h2>
                <p>Hi ${fullName},</p>
                <p>Your Crown Ledger account was just accessed.</p>
                <div class="alert-box">
                  <p><strong>Login Details:</strong></p>
                  <p>Time: ${new Date().toLocaleString()}</p>
                  <p>If this wasn't you, please secure your account immediately by changing your password.</p>
                </div>
                <p>Your account security is important to us. If you notice any suspicious activity, please contact our support team right away.</p>
              </div>
              <div class="footer">
                <p>&copy; 2026 Crown Ledger. All rights reserved.</p>
                <p>This is an automated email. Please do not reply.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    }
    generateInvestmentConfirmationEmailHtml(fullName, planName, amount, currency) {
        return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'DM Sans', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg,#F8F9FC 0%,#EEF2FF 100%); }
            .email-body { background-color: #ffffff; padding: 30px; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
            .header { text-align: center; margin-bottom: 30px; }
            ${this.logoHeaderStyles()}
            .content { margin-bottom: 30px; }
            .success-box { background-color: #F0FDF4; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; border-radius: 8px; }
            .success-box p { color: #065F46; margin: 8px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="email-body">
              <div class="header">
                ${this.logoHeaderHtml()}
              </div>
              <div class="content">
                <h2>Investment Confirmed</h2>
                <p>Hi ${fullName},</p>
                <p>Your investment has been successfully processed!</p>
                <div class="success-box">
                  <p><strong>Investment Details:</strong></p>
                  <p>Plan: <strong>${planName}</strong></p>
                  <p>Amount: <strong>${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></p>
                  <p>Date: <strong>${new Date().toLocaleDateString()}</strong></p>
                </div>
                <p>You can track your investment growth and performance in your Crown Ledger dashboard. Our team is working to grow your investments and deliver the best returns.</p>
              </div>
              <div class="footer">
                <p>&copy; 2026 Crown Ledger. All rights reserved.</p>
                <p>This is an automated email. Please do not reply.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    }
    generateSavingsWelcomeEmailHtml(fullName, apy) {
        return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'DM Sans', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg,#F8F9FC 0%,#EEF2FF 100%); }
            .email-body { background-color: #ffffff; padding: 30px; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
            .header { text-align: center; margin-bottom: 30px; }
            ${this.logoHeaderStyles()}
            .content { margin-bottom: 30px; }
            .info-box { background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 15px; margin: 20px 0; border-radius: 8px; }
            .info-box p { color: #1E40AF; margin: 8px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="email-body">
              <div class="header">
                ${this.logoHeaderHtml()}
              </div>
              <div class="content">
                <h2>Savings Account Created</h2>
                <p>Hi ${fullName},</p>
                <p>Your Crown Ledger savings account has been successfully created! Start earning interest on your savings today.</p>
                <div class="info-box">
                  <p><strong>Savings Features:</strong></p>
                  <p>Annual Percentage Yield (APY): <strong>${apy}%</strong></p>
                  <p>FDIC Insurance Protection: <strong>Up to $250,000</strong></p>
                  <p>Daily Interest Calculation: <strong>Yes</strong></p>
                  <p>Zero Fees: <strong>Always</strong></p>
                </div>
                <p>Your interest will be calculated daily and credited to your account. The more you save, the more you earn!</p>
              </div>
              <div class="footer">
                <p>&copy; 2026 Crown Ledger. All rights reserved.</p>
                <p>This is an automated email. Please do not reply.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    }
    generateSavingsDepositConfirmationEmailHtml(fullName, depositAmount, newBalance, monthlyInterest, savingsGoal, planBalanceAfter, targetAmount, progressPercentage) {
        return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'DM Sans', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg,#F8F9FC 0%,#EEF2FF 100%); }
            .email-body { background-color: #ffffff; padding: 30px; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
            .header { text-align: center; margin-bottom: 30px; }
            ${this.logoHeaderStyles()}
            .content { margin-bottom: 30px; }
            .success-box { background-color: #F0FDF4; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; border-radius: 8px; }
            .success-box p { color: #065F46; margin: 8px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="email-body">
              <div class="header">
                ${this.logoHeaderHtml()}
              </div>
              <div class="content">
                <h2>Savings Deposit Confirmed</h2>
                <p>Hi ${fullName},</p>
                <p>Your savings deposit has been successfully processed!</p>
                <div class="success-box">
                  <p><strong>Deposit Details:</strong></p>
                  <p>Deposit Amount: <strong>$${depositAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></p>
                  <p>New Balance: <strong>$${newBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></p>
                  <p>Projected Monthly Interest: <strong>$${monthlyInterest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></p>
                  <p>Date: <strong>${new Date().toLocaleDateString()}</strong></p>
                  ${savingsGoal ? `
                    <p style="margin-top: 15px; border-top: 1px solid #ddd; padding-top: 15px;">
                      <strong>Savings Plan: "${savingsGoal}"</strong>
                    </p>
                    <p>Plan Balance: <strong>$${planBalanceAfter?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></p>
                    <p>Target Amount: <strong>$${targetAmount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></p>
                    <p>Progress: <strong>${progressPercentage?.toFixed(1)}%</strong></p>
                  ` : ''}
                </div>
                <p>Your savings are growing with daily interest calculations. Visit your Crown Ledger dashboard to track your earnings!</p>
              </div>
              <div class="footer">
                <p>&copy; 2026 Crown Ledger. All rights reserved.</p>
                <p>This is an automated email. Please do not reply.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    }
    generateAdminSavingsBalanceUpdateEmailHtml(fullName, amountChanged, balanceBefore, balanceAfter, planName, reason) {
        const direction = amountChanged >= 0 ? 'increased' : 'decreased';
        const formattedAmount = Math.abs(amountChanged).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const formattedBefore = balanceBefore.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const formattedAfter = balanceAfter.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'DM Sans', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg,#F8F9FC 0%,#EEF2FF 100%); }
            .email-body { background-color: #ffffff; padding: 30px; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
            .header { text-align: center; margin-bottom: 30px; }
            ${this.logoHeaderStyles()}
            .update-box { background-color: #FFF7ED; border-left: 4px solid #FA510F; padding: 15px; margin: 20px 0; border-radius: 8px; }
            .update-box p { color: #7C2D12; margin: 8px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="email-body">
              <div class="header">${this.logoHeaderHtml()}</div>
              <h2>Savings Balance Updated</h2>
              <p>Hi ${fullName},</p>
              <p>Your savings balance has been updated.</p>
              <div class="update-box">
                <p><strong>Update Details:</strong></p>
                <p>Savings Plan: <strong>${planName}</strong></p>
                <p>Amount ${direction}: <strong>$${formattedAmount}</strong></p>
                <p>Previous Balance: <strong>$${formattedBefore}</strong></p>
                <p>New Balance: <strong>$${formattedAfter}</strong></p>
                <p>Reason: <strong>${reason}</strong></p>
                <p>Date: <strong>${new Date().toLocaleString()}</strong></p>
              </div>
              <p>If you do not recognize this change, please contact Crown Ledger support immediately.</p>
              <div class="footer">
                <p>&copy; 2026 Crown Ledger. All rights reserved.</p>
                <p>This is an automated email. Please do not reply.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    }
    generateAdminInvestmentBalanceUpdateEmailHtml(fullName, amountChanged, balanceBefore, balanceAfter, planName, reason) {
        const direction = amountChanged >= 0 ? 'increased' : 'decreased';
        const money = (value) => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return `
      <!DOCTYPE html><html><head><meta charset="UTF-8">
      <style>
            body { font-family: 'DM Sans', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg,#F8F9FC 0%,#EEF2FF 100%); }
            .email-body { background-color: #ffffff; padding: 30px; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
            .header { text-align: center; margin-bottom: 30px; }
            ${this.logoHeaderStyles()}
            .update-box { background-color: #FFF7ED; border-left: 4px solid #FA510F; padding: 15px; margin: 20px 0; border-radius: 8px; }
            .update-box p { color: #7C2D12; margin: 8px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
          </style>
      </head>
      <body><div class="container"><div class="email-body">
        <div class="header">${this.logoHeaderHtml()}</div>
        <h2>Investment Balance Updated</h2>
        <p>Hi ${fullName},</p>
        <p>Your investment balance has been updated.</p>
        <div class="update-box">
          <p><strong>Investment Plan:</strong> ${planName}</p>
          <p><strong>Amount ${direction}:</strong> $${money(Math.abs(amountChanged))}</p>
          <p><strong>Previous Balance:</strong> $${money(balanceBefore)}</p>
          <p><strong>New Balance:</strong> $${money(balanceAfter)}</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <p>If you do not recognize this change, please contact Crown Ledger support immediately.</p>
        <div class="footer"><p>&copy; 2026 Crown Ledger. All rights reserved.</p><p>This is an automated email. Please do not reply.</p></div>
      </div></div></body></html>
    `;
    }
    generateSavingsPlanCreatedEmailHtml(fullName, planName, targetAmount, duration, frequency) {
        return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'DM Sans', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg,#F8F9FC 0%,#EEF2FF 100%); }
            .email-body { background-color: #ffffff; padding: 30px; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
            .header { text-align: center; margin-bottom: 30px; }
            ${this.logoHeaderStyles()}
            .content { margin-bottom: 30px; }
            .success-box { background-color: #F0FDF4; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; border-radius: 8px; }
            .success-box p { color: #065F46; margin: 8px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="email-body">
              <div class="header">
                ${this.logoHeaderHtml()}
              </div>
              <div class="content">
                <h2>Your Savings Plan is Ready!</h2>
                <p>Hi ${fullName},</p>
                <p>Great news! Your savings plan has been successfully created. You're one step closer to achieving your financial goals!</p>
                <div class="success-box">
                  <p><strong>Plan Details:</strong></p>
                  <p>Plan Name: <strong>${planName}</strong></p>
                  <p>Target Amount: <strong>$${targetAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></p>
                  <p>Duration: <strong>${duration} months</strong></p>
                  <p>Savings Frequency: <strong>${frequency.charAt(0).toUpperCase() + frequency.slice(1)}</strong></p>
                  <p>Date Created: <strong>${new Date().toLocaleDateString()}</strong></p>
                </div>
                <p>Start making regular deposits to reach your target amount. Each deposit brings you closer to your goal, and you'll earn daily interest on your savings!</p>
                <p>Log in to your Crown Ledger dashboard to make your first deposit and track your progress.</p>
              </div>
              <div class="footer">
                <p>&copy; 2026 Crown Ledger. All rights reserved.</p>
                <p>This is an automated email. Please do not reply.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    }
    generateDepositReminderEmailHtml(fullName, planName, suggestedAmount, nextDueDate) {
        return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'DM Sans', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg,#F8F9FC 0%,#EEF2FF 100%); }
            .email-body { background-color: #ffffff; padding: 30px; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
            .header { text-align: center; margin-bottom: 30px; }
            ${this.logoHeaderStyles()}
            .content { margin-bottom: 30px; }
            .reminder-box { background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 8px; }
            .reminder-box p { color: #92400E; margin: 8px 0; }
            .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #FA510F 0%, #D94309 100%); color: #ffffff; text-decoration: none; border-radius: 10px; margin: 20px 0; font-weight: 600; box-shadow: 0 4px 12px rgba(250,81,15,0.3); }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="email-body">
              <div class="header">
                ${this.logoHeaderHtml()}
              </div>
              <div class="content">
                <h2>Time to Save!</h2>
                <p>Hi ${fullName},</p>
                <p>Your scheduled deposit is due for your savings plan. Stay on track with your savings goal!</p>
                <div class="reminder-box">
                  <p><strong>Deposit Reminder:</strong></p>
                  <p>Plan: <strong>${planName}</strong></p>
                  <p>Suggested Deposit Amount: <strong>$${suggestedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></p>
                  <p>Due Date: <strong>${new Date(nextDueDate).toLocaleDateString()}</strong></p>
                </div>
                <p>Making regular deposits helps you stay committed to your savings goals and maximizes your earned interest. Log in now to make your deposit!</p>
              </div>
              <div class="footer">
                <p>&copy; 2026 Crown Ledger. All rights reserved.</p>
                <p>This is an automated email. Please do not reply.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    }
    generatePasswordChangeEmailHtml(fullName) {
        return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'DM Sans', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg,#F8F9FC 0%,#EEF2FF 100%); }
            .email-body { background-color: #ffffff; padding: 30px; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
            .header { text-align: center; margin-bottom: 30px; }
            ${this.logoHeaderStyles()}
            .content { margin-bottom: 30px; }
            .security-box { background-color: #DBEAFE; border-left: 4px solid #0284C7; padding: 15px; margin: 20px 0; border-radius: 8px; }
            .security-box p { color: #075985; margin: 8px 0; }
            .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
            .action-list { list-style: none; padding: 0; margin: 15px 0; }
            .action-list li { padding: 8px 0; padding-left: 25px; position: relative; color: #374151; }
            .action-list li:before { content: "✓"; position: absolute; left: 0; color: #10B981; font-weight: bold; font-size: 16px; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="email-body">
              <div class="header">
                ${this.logoHeaderHtml()}
              </div>
              <div class="content">
                <h2>Password Changed Successfully</h2>
                <div class="success-icon">✓</div>
                <p>Hi ${fullName},</p>
                <p>Your password has been successfully changed. Your account is now secured with your new password.</p>
                <div class="security-box">
                  <p><strong>Security Notice:</strong></p>
                  <p>For your security, all your login sessions have been signed out. You will need to log in again on all your devices with your new password.</p>
                </div>
                <h3>What's Next?</h3>
                <ul class="action-list">
                  <li>Log in with your new password on all devices</li>
                  <li>Your old password will no longer work</li>
                  <li>Keep your password secure and don't share it with anyone</li>
                </ul>
                <p><strong>If you didn't make this change,</strong> please contact us immediately at support@bankapp.com or call our support team.</p>
              </div>
              <div class="footer">
                <p>&copy; 2026 Crown Ledger. All rights reserved.</p>
                <p>This is an automated email. Please do not reply.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    }
    generateSupportTicketConfirmationEmailHtml(fullName, subject, ticketId) {
        return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'DM Sans', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg,#F8F9FC 0%,#EEF2FF 100%); }
            .email-body { background-color: #ffffff; padding: 30px; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
            .header { text-align: center; margin-bottom: 30px; }
            ${this.logoHeaderStyles()}
            .content { margin-bottom: 30px; }
            .ticket-box { background-color: #F0FDF4; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; border-radius: 8px; }
            .ticket-box p { color: #065F46; margin: 8px 0; }
            .ticket-id { font-family: monospace; background: #f0f0f0; padding: 8px; border-radius: 4px; display: inline-block; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="email-body">
              <div class="header">
                ${this.logoHeaderHtml()}
              </div>
              <div class="content">
                <h2>Support Ticket Received</h2>
                <p>Hi ${fullName},</p>
                <p>Thank you for contacting Crown Ledger support. We have received your support request and our team will review it shortly.</p>
                <div class="ticket-box">
                  <p><strong>Your Ticket Details:</strong></p>
                  <p>Ticket ID: <span class="ticket-id">#${ticketId}</span></p>
                  <p>Subject: <strong>${subject}</strong></p>
                  <p>Status: <strong>Open</strong></p>
                  <p>Submitted: <strong>${new Date().toLocaleString()}</strong></p>
                </div>
                <p>Our support team typically responds within 24-48 hours. We appreciate your patience and will get back to you as soon as possible.</p>
                <p>You can track your ticket status and view updates in your Crown Ledger account dashboard.</p>
              </div>
              <div class="footer">
                <p>&copy; 2026 Crown Ledger. All rights reserved.</p>
                <p>This is an automated email. Please do not reply.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    }
    generateSupportTicketAdminEmailHtml(ticket) {
        return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'DM Sans', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 700px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
            .email-body { background-color: #ffffff; padding: 30px; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
            .header { border-bottom: 2px solid #FA510F; padding-bottom: 15px; margin-bottom: 20px; }
            .ticket-info { background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .info-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .priority-high { color: #DC2626; font-weight: bold; }
            .priority-medium { color: #EA580C; font-weight: bold; }
            .priority-low { color: #16A34A; font-weight: bold; }
            .message-box { background-color: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="email-body">
              <div class="header">
                <h2>New Support Ticket Received</h2>
              </div>
              <div class="ticket-info">
                <div class="info-row">
                  <span><strong>Ticket ID:</strong></span>
                  <span>#${ticket._id}</span>
                </div>
                <div class="info-row">
                  <span><strong>User:</strong></span>
                  <span>${ticket.userName} (${ticket.userEmail})</span>
                </div>
                <div class="info-row">
                  <span><strong>Topic:</strong></span>
                  <span>${ticket.topic}</span>
                </div>
                <div class="info-row">
                  <span><strong>Priority:</strong></span>
                  <span class="priority-${ticket.priority}">${ticket.priority.toUpperCase()}</span>
                </div>
                <div class="info-row">
                  <span><strong>Status:</strong></span>
                  <span>${ticket.status}</span>
                </div>
              </div>
              <h3>${ticket.subject}</h3>
              <div class="message-box">
                <p>${ticket.message.replace(/\n/g, '<br>')}</p>
              </div>
              <p><strong>Action Required:</strong> Please review and respond to this ticket as soon as possible.</p>
              <div class="footer">
                <p>Crown Ledger Support Management System</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    }
    generateSupportTicketStatusUpdateEmailHtml(fullName, subject, ticketId, newStatus) {
        const statusColors = {
            open: '#3B82F6',
            'in-progress': '#F59E0B',
            resolved: '#10B981',
            closed: '#6B7280',
        };
        return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'DM Sans', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg,#F8F9FC 0%,#EEF2FF 100%); }
            .email-body { background-color: #ffffff; padding: 30px; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
            .header { text-align: center; margin-bottom: 30px; }
            ${this.logoHeaderStyles()}
            .content { margin-bottom: 30px; }
            .status-badge { display: inline-block; padding: 10px 20px; border-radius: 20px; color: white; font-weight: bold; margin: 10px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="email-body">
              <div class="header">
                ${this.logoHeaderHtml()}
              </div>
              <div class="content">
                <h2>Support Ticket Update</h2>
                <p>Hi ${fullName},</p>
                <p>Your support ticket has been updated. Here's what changed:</p>
                <p><strong>Ticket:</strong> ${subject}</p>
                <p><strong>Ticket ID:</strong> #${ticketId}</p>
                <p><strong>New Status:</strong></p>
                <div class="status-badge" style="background-color: ${statusColors[newStatus] || '#6B7280'};">
                  ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}
                </div>
                <p>Check your Crown Ledger account to view more details about your support request.</p>
              </div>
              <div class="footer">
                <p>&copy; 2026 Crown Ledger. All rights reserved.</p>
                <p>This is an automated email. Please do not reply.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    }
    generateAdminWalletCreditEmailHtml(fullName, amountChanged, balanceBefore, balanceAfter, accountNumber, reason) {
        const direction = amountChanged >= 0 ? 'credited' : 'debited';
        const money = (value) => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return `
      <!DOCTYPE html><html><head><meta charset="UTF-8">
      <style>
            body { font-family: 'DM Sans', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg,#F8F9FC 0%,#EEF2FF 100%); }
            .email-body { background-color: #ffffff; padding: 30px; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
            .header { text-align: center; margin-bottom: 30px; }
            ${this.logoHeaderStyles()}
            .update-box { background-color: #FFF7ED; border-left: 4px solid #FA510F; padding: 15px; margin: 20px 0; border-radius: 8px; }
            .update-box p { color: #7C2D12; margin: 8px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
          </style>
      </head>
      <body><div class="container"><div class="email-body">
        <div class="header">${this.logoHeaderHtml()}</div>
        <h2>Wallet Balance Updated</h2>
        <p>Hi ${fullName},</p>
        <p>Your Crown Ledger wallet has been ${direction}.</p>
        <div class="update-box">
          <p><strong>Account Number:</strong> ${accountNumber}</p>
          <p><strong>Amount ${direction}:</strong> $${money(Math.abs(amountChanged))}</p>
          <p><strong>Previous Balance:</strong> $${money(balanceBefore)}</p>
          <p><strong>New Balance:</strong> $${money(balanceAfter)}</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <p>If you do not recognize this change, please contact Crown Ledger support immediately.</p>
        <div class="footer"><p>&copy; 2026 Crown Ledger. All rights reserved.</p><p>This is an automated email. Please do not reply.</p></div>
      </div></div></body></html>
    `;
    }
    generateWithdrawalRequestAdminEmailHtml(userFullName, accountNumber, amount, bitcoinAddress) {
        const money = (value) => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'DM Sans', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 700px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
            .email-body { background-color: #ffffff; padding: 30px; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
            .header { border-bottom: 2px solid #FA510F; padding-bottom: 15px; margin-bottom: 20px; }
            .ticket-info { background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .info-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .address-box { font-family: monospace; background: #f0f0f0; padding: 10px; border-radius: 6px; word-break: break-all; margin: 10px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="email-body">
              <div class="header">
                <h2>New Withdrawal Request Pending Review</h2>
              </div>
              <div class="ticket-info">
                <div class="info-row"><span><strong>User:</strong></span><span>${userFullName}</span></div>
                <div class="info-row"><span><strong>Account Number:</strong></span><span>${accountNumber}</span></div>
                <div class="info-row"><span><strong>Amount Requested:</strong></span><span>$${money(amount)}</span></div>
                <div class="info-row"><span><strong>Submitted:</strong></span><span>${new Date().toLocaleString()}</span></div>
              </div>
              <p><strong>Bitcoin Wallet Address:</strong></p>
              <div class="address-box">${bitcoinAddress}</div>
              <p><strong>Action Required:</strong> Please review this request in the admin dashboard and approve or reject it.</p>
              <div class="footer">
                <p>Crown Ledger Admin Management System</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    }
    generateWithdrawalReviewedEmailHtml(fullName, amount, bitcoinAddress, status, note) {
        const money = (value) => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const isApproved = status === 'approved';
        const boxColor = isApproved ? '#F0FDF4' : '#FEF2F2';
        const borderColor = isApproved ? '#10B981' : '#DC2626';
        const textColor = isApproved ? '#065F46' : '#991B1B';
        return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'DM Sans', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg,#F8F9FC 0%,#EEF2FF 100%); }
            .email-body { background-color: #ffffff; padding: 30px; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
            .header { text-align: center; margin-bottom: 30px; }
            ${this.logoHeaderStyles()}
            .content { margin-bottom: 30px; }
            .status-box { background-color: ${boxColor}; border-left: 4px solid ${borderColor}; padding: 15px; margin: 20px 0; border-radius: 8px; }
            .status-box p { color: ${textColor}; margin: 8px 0; }
            .address-box { font-family: monospace; background: #f0f0f0; padding: 10px; border-radius: 6px; word-break: break-all; margin: 10px 0; font-size: 13px; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="email-body">
              <div class="header">
                ${this.logoHeaderHtml()}
              </div>
              <div class="content">
                <h2>Withdrawal Request ${isApproved ? 'Approved' : 'Rejected'}</h2>
                <p>Hi ${fullName},</p>
                <p>Your Bitcoin withdrawal request has been ${isApproved ? 'approved and processed' : 'rejected'} by our team.</p>
                <div class="status-box">
                  <p><strong>Amount:</strong> $${money(amount)}</p>
                  <p><strong>Status:</strong> ${isApproved ? 'Approved' : 'Rejected'}</p>
                  ${note ? `<p><strong>Note:</strong> ${note}</p>` : ''}
                  <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                </div>
                <p><strong>Destination Address:</strong></p>
                <div class="address-box">${bitcoinAddress}</div>
                ${isApproved
            ? '<p>Your funds are on their way. If you don\'t see them arrive shortly, please contact support.</p>'
            : '<p>If you believe this was a mistake or have questions, please contact our support team.</p>'}
              </div>
              <div class="footer">
                <p>&copy; 2026 Crown Ledger. All rights reserved.</p>
                <p>This is an automated email. Please do not reply.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    }
    generateAdminCustomEmailHtml(fullName, subject, message, ticketId) {
        // Preserve paragraph breaks from the admin's message without allowing raw HTML through.
        const escapeHtml = (str) => str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');
        return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: 'DM Sans', Arial, sans-serif;
              line-height: 1.6;
              color: #E5E7EB;
              background-color: #18181B;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 24px;
              background-color: #18181B;
            }
            .header {
              text-align: center;
              padding: 24px 0 8px 0;
            }
            .logo-table { margin: 0 auto; border-collapse: collapse; }
            .logo-table td { vertical-align: middle; padding: 0; }
            .logo-img { width: 44px; height: 44px; display: block; padding: 12px;}
            .logo-text-cell { padding-left: 14px; }
            .logo-text { font-size: 18px; font-weight: 800; color: #111827; white-space: nowrap; }
            .logo-text .brand { color: #FA510F; }
            .email-body {
              background-color: #232326;
              border: 1px solid #313135;
              border-radius: 16px;
              padding: 32px;
            }
            .support-label {
              display: flex;
              align-items: center;
              gap: 10px;
              margin-bottom: 22px;
            }
            .support-label span {
              font-size: 15px;
              font-weight: 700;
              color: #F4F4F5;
            }
            .greeting {
              font-size: 15px;
              color: #F4F4F5;
              margin-bottom: 18px;
            }
            .subject-line {
              font-size: 13px;
              color: #A1A1AA;
              margin-bottom: 4px;
              text-transform: uppercase;
              letter-spacing: 0.4px;
              font-weight: 700;
            }
            .message-content {
              font-size: 15px;
              color: #D4D4D8;
              margin: 8px 0 26px 0;
              white-space: pre-line;
            }
            .signoff {
              font-size: 15px;
              color: #D4D4D8;
              margin-top: 8px;
            }
            .ticket-row {
              margin-top: 22px;
              padding-top: 18px;
              border-top: 1px solid #313135;
              font-size: 13px;
              color: #A1A1AA;
            }
            .ticket-row strong { color: #F4F4F5; }
            .footer {
              text-align: center;
              color: #71717A;
              font-size: 11px;
              margin-top: 24px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <table class="logo-table" role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td>
                    <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/crown-5qzJ7RGtUeUieMErT9XJBV7XaVcLJV.png" alt="Crown Ledger" class="logo-img">
                  </td>
                  <td class="logo-text-cell">
                    <div class="logo-text">Crown <span class="brand">Ledger</span></div>
                  </td>
                </tr>
              </table>
            </div>

            <div class="email-body">
              <div class="support-label">
                <span>🎧 Crown Ledger Support</span>
              </div>

              <div class="greeting">Hello ${fullName}, 👋</div>

              <div class="subject-line">${subject}</div>
              <div class="message-content">${safeMessage}</div>

              <div class="signoff">
                Regards,<br>
                Crown Ledger Support
              </div>

              ${ticketId ? `
                <div class="ticket-row">
                  Ticket <strong>#${ticketId}</strong>
                </div>
              ` : ''}
            </div>

            <div class="footer">
              <p>&copy; 2026 Crown Ledger. All rights reserved.</p>
              <p>This is a message from Crown Ledger support — please reply to this email if you have questions.</p>
            </div>
          </div>
        </body>
      </html>
    `;
    }
}
exports.default = new EmailService();
