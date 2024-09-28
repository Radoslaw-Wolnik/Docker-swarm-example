import nodemailer from 'nodemailer';
import environment from '../config/environment';
import templateManager from '../utils/email-templates.util';
import logger from '../utils/logger.util';
import { IUserDocument } from '../models/user.model';
import { generateAnonymousToken } from '../middleware/auth.middleware';
import { EmailUserInfo } from '../types/email.types';
import jwt, { JwtPayload } from 'jsonwebtoken';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter;

  private constructor() {
    this.transporter = nodemailer.createTransport({
      host: environment.email.host,
      port: environment.email.port,
      auth: {
        user: environment.email.user,
        pass: environment.email.password,
      }
    });
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendEmail({ to, subject, text, html }: EmailOptions): Promise<void> {
    const mailOptions: nodemailer.SendMailOptions = {
      from: environment.email.from,
      to,
      subject,
      text,
      html
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent successfully', { messageId: info.messageId, to });
    } catch (error) {
      logger.error('Error sending email', { error, to });
      throw error;
    }
  }

  async sendTemplatedEmail(to: string, templateName: string, variables: Record<string, any>, userInfo: EmailUserInfo): Promise<void> {
    try {
      if (userInfo.isAnonymous) {
        const token = this.generateAnonymousToken(userInfo.id);
        variables.token = token;
      }

      const renderedTemplate = await templateManager.renderTemplate(templateName, variables);
      await this.sendEmail({
        to,
        ...renderedTemplate
      });
    } catch (error) {
      logger.error('Error sending templated email', { error, templateName, to });
      throw error;
    }
  }

  private generateAnonymousToken(userId: string): string {
    const payload = {
      id: userId,
      isAnonymous: true,
      // email: await user.getDecryptedEmail()
    };
    return jwt.sign(payload, environment.auth.jwtSecret, {
      expiresIn: '30d' // Token expires in 30 days
    });
  }

  async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      logger.info('Email service connection verified');
    } catch (error) {
      logger.error('Email service connection failed', { error });
      throw error;
    }
  }
}

// Export a single instance
export const emailService = EmailService.getInstance();
