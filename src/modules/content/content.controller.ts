import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ContentService } from './content.service';
import { CreateContentDto, UpdateContentDto } from './dto/content.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('content')
@Controller('content')
export class ContentController {
    constructor(private readonly contentService: ContentService) {}

    // Public endpoint — no auth needed
    @Get(':type')
    @ApiOperation({ summary: 'Get published content by type (terms, privacy, etc.)' })
    @ApiQuery({ name: 'locale', required: false, description: 'Locale code (en, ar)' })
    async getByType(
        @Param('type') type: string,
        @Query('locale') locale?: string,
    ) {
        return this.contentService.getByType(type, locale || 'en');
    }

    // Admin endpoints
    @Get()
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get all content (admin)' })
    async getAll() {
        return this.contentService.getAll();
    }

    @Post()
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Create content (admin)' })
    async create(@Body() dto: CreateContentDto) {
        return this.contentService.create(dto);
    }

    @Patch(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Update content (admin)' })
    async update(@Param('id') id: string, @Body() dto: UpdateContentDto) {
        return this.contentService.update(id, dto);
    }

    @Delete(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Delete content (admin)' })
    async remove(@Param('id') id: string) {
        return this.contentService.delete(id);
    }
}
