import { IsEnum, IsOptional, IsString, MaxLength, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentType } from '../../../database/entities/app-content.entity';

export class CreateContentDto {
    @ApiProperty({ enum: ContentType })
    @IsEnum(ContentType)
    type: ContentType;

    @ApiProperty()
    @IsString()
    @MaxLength(200)
    title: string;

    @ApiProperty()
    @IsString()
    content: string;

    @ApiPropertyOptional({ default: 'en' })
    @IsOptional()
    @IsString()
    locale?: string;
}

export class UpdateContentDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(200)
    title?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    content?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isPublished?: boolean;
}
