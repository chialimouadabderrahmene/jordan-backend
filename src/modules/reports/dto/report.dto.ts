import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportReason, ReportStatus } from '../../../database/entities/report.entity';

export class CreateReportDto {
    @ApiPropertyOptional({ description: 'User ID to report (optional for feedback/bug/suggestion)' })
    @IsOptional()
    @IsUUID()
    reportedId?: string;

    @ApiProperty({ enum: ReportReason })
    @IsEnum(ReportReason)
    reason: ReportReason;

    @ApiPropertyOptional({ maxLength: 1000 })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    details?: string;
}

export class UpdateReportStatusDto {
    @ApiProperty({ enum: ReportStatus })
    @IsEnum(ReportStatus)
    status: ReportStatus;

    @ApiPropertyOptional({ maxLength: 500 })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    moderatorNote?: string;
}
