import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private transporter: Transporter;
    private isReady = false;

    constructor(private readonly configService: ConfigService) {
        this.initTransporter();
    }

    private async initTransporter() {
        const host = this.configService.get<string>('mail.host', 'smtp.gmail.com');
        const port = this.configService.get<number>('mail.port', 587);
        const user = this.configService.get<string>('mail.user', '');
        const pass = this.configService.get<string>('mail.pass', '');

        this.logger.log(`[SMTP] Initializing: host=${host} port=${port} user=${user}`);

        this.transporter = nodemailer.createTransport({
            host,
            port,
            secure: false, // false for port 587 (STARTTLS)
            requireTLS: true,
            auth: {
                user,
                pass,
            },
            connectionTimeout: 10000, // 10s connection timeout
            socketTimeout: 10000,     // 10s socket timeout
            greetingTimeout: 10000,   // 10s greeting timeout
        });

        // Verify SMTP connection on startup (non-blocking)
        try {
            await this.transporter.verify();
            this.isReady = true;
            this.logger.log('✅ SMTP READY — email sending is operational');
        } catch (error) {
            this.isReady = false;
            this.logger.error(`❌ SMTP NOT READY — ${error.message}`);
            this.logger.warn('⚠️  OTP codes will be logged to console as fallback');
        }
    }

    /**
     * Send email — NEVER throws, NEVER blocks the caller.
     * If sending fails, logs the error and returns false.
     */
    async sendMail(to: string, subject: string, html: string): Promise<boolean> {
        const from = this.configService.get<string>('mail.from', 'noreply@wafaa.app');

        try {
            this.logger.log(`[MAIL] Sending to=${to} subject="${subject}"`);

            const info = await this.transporter.sendMail({
                from: `"Wafaa App" <${from}>`,
                to,
                subject,
                html,
            });

            this.logger.log(`[MAIL] ✅ Sent successfully — messageId=${info.messageId}`);
            return true;
        } catch (error) {
            this.logger.error(`[MAIL] ❌ Failed to send to ${to}: ${error.message}`);
            return false;
        }
    }

    /**
     * Send OTP email — non-blocking, with console fallback.
     * If SMTP fails, the OTP is printed to console.
     */
    async sendOtpEmail(to: string, otp: string): Promise<boolean> {
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #e91e63; text-align: center;">Wafaa - Email Verification</h2>
                <p style="font-size: 16px; color: #333;">Your verification code is:</p>
                <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #e91e63;">${otp}</span>
                </div>
                <p style="font-size: 14px; color: #666;">This code expires in 5 minutes.</p>
                <p style="font-size: 14px; color: #666;">If you didn't request this code, please ignore this email.</p>
            </div>
        `;

        const sent = await this.sendMail(to, 'Wafaa - Your Verification Code', html);

        if (!sent) {
            // FALLBACK: Print OTP to console so signup doesn't break
            this.logger.warn(`🔑 OTP FALLBACK (email failed): email=${to} code=${otp}`);
        }

        return sent;
    }
}
