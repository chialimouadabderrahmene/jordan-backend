import {
    Injectable,
    Logger,
    BadRequestException,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { OtpCode } from '../../database/entities/otp-code.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class OtpService {
    private readonly logger = new Logger(OtpService.name);
    private static readonly OTP_EXPIRY_MINUTES = 5;
    private static readonly MAX_ATTEMPTS = 5;

    constructor(
        @InjectRepository(OtpCode)
        private readonly otpRepository: Repository<OtpCode>,
        private readonly mailService: MailService,
    ) { }

    /**
     * Generate a 6-digit OTP, store hashed in DB, send via email.
     * NEVER throws if email fails — falls back to console logging.
     */
    async generateAndSend(email: string): Promise<{ message: string }> {
        this.logger.log(`[OTP] Generating OTP for email=${email}`);

        // Invalidate any existing unused OTPs for this email
        await this.otpRepository.update(
            { email, used: false },
            { used: true },
        );
        this.logger.log(`[OTP] Invalidated previous OTPs for ${email}`);

        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        this.logger.log(`[OTP] Generated code for ${email}`);

        // Hash the code before storing
        const salt = await bcrypt.genSalt(10);
        const codeHash = await bcrypt.hash(code, salt);

        // Set expiry (5 minutes from now)
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + OtpService.OTP_EXPIRY_MINUTES);

        // Save to database
        const otpRecord = this.otpRepository.create({
            email,
            codeHash,
            expiresAt,
            attempts: 0,
            used: false,
        });
        await this.otpRepository.save(otpRecord);
        this.logger.log(`[OTP] Saved to DB — id=${otpRecord.id} expiresAt=${expiresAt.toISOString()}`);

        // Send email (non-blocking — doesn't throw)
        const emailSent = await this.mailService.sendOtpEmail(email, code);
        this.logger.log(`[OTP] Email sent=${emailSent} for ${email}`);

        return {
            message: emailSent
                ? 'Verification code sent to your email'
                : 'Verification code generated (check server logs if email not received)',
        };
    }

    /**
     * Verify an OTP code.
     * Returns true if valid, throws if invalid/expired/too many attempts.
     */
    async verify(email: string, code: string): Promise<boolean> {
        this.logger.log(`[OTP VERIFY] email=${email}`);

        // Find the latest unused OTP for this email
        const otpRecord = await this.otpRepository.findOne({
            where: {
                email,
                used: false,
                expiresAt: MoreThan(new Date()),
            },
            order: { createdAt: 'DESC' },
        });

        if (!otpRecord) {
            this.logger.warn(`[OTP VERIFY] No valid OTP found for ${email}`);
            throw new BadRequestException('No valid verification code found. Please request a new one.');
        }

        // Check max attempts
        if (otpRecord.attempts >= OtpService.MAX_ATTEMPTS) {
            this.logger.warn(`[OTP VERIFY] Max attempts exceeded for ${email}`);
            // Mark as used so it can't be retried
            otpRecord.used = true;
            await this.otpRepository.save(otpRecord);
            throw new BadRequestException('Too many attempts. Please request a new verification code.');
        }

        // Increment attempts
        otpRecord.attempts += 1;
        await this.otpRepository.save(otpRecord);

        // Compare hashed code
        const isValid = await bcrypt.compare(code, otpRecord.codeHash);

        if (!isValid) {
            this.logger.warn(`[OTP VERIFY] Invalid code for ${email} — attempt ${otpRecord.attempts}/${OtpService.MAX_ATTEMPTS}`);
            throw new BadRequestException(
                `Invalid verification code. ${OtpService.MAX_ATTEMPTS - otpRecord.attempts} attempts remaining.`,
            );
        }

        // Mark as used
        otpRecord.used = true;
        await this.otpRepository.save(otpRecord);

        this.logger.log(`[OTP VERIFY] ✅ Success for ${email}`);
        return true;
    }

    /**
     * Resend OTP — generates a new one and invalidates the old one.
     */
    async resend(email: string): Promise<{ message: string }> {
        this.logger.log(`[OTP RESEND] email=${email}`);
        return this.generateAndSend(email);
    }

    /**
     * Cleanup expired OTPs (can be called periodically).
     */
    async cleanupExpired(): Promise<number> {
        const result = await this.otpRepository.delete({
            expiresAt: LessThan(new Date()),
        });
        const count = result.affected || 0;
        if (count > 0) {
            this.logger.log(`[OTP CLEANUP] Deleted ${count} expired OTPs`);
        }
        return count;
    }
}
