import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppContent, ContentType } from '../../database/entities/app-content.entity';
import { CreateContentDto, UpdateContentDto } from './dto/content.dto';

@Injectable()
export class ContentService {
    constructor(
        @InjectRepository(AppContent)
        private readonly contentRepo: Repository<AppContent>,
    ) {}

    async getByType(type: string, locale: string = 'en'): Promise<AppContent> {
        const content = await this.contentRepo.findOne({
            where: { type: type as ContentType, locale, isPublished: true },
        });
        if (!content) {
            throw new NotFoundException(`Content not found for type: ${type}, locale: ${locale}`);
        }
        return content;
    }

    async getAll(): Promise<AppContent[]> {
        return this.contentRepo.find({ order: { type: 'ASC', locale: 'ASC' } });
    }

    async create(dto: CreateContentDto): Promise<AppContent> {
        const content = this.contentRepo.create({
            type: dto.type,
            title: dto.title,
            content: dto.content,
            locale: dto.locale || 'en',
        });
        return this.contentRepo.save(content);
    }

    async update(id: string, dto: UpdateContentDto): Promise<AppContent> {
        const content = await this.contentRepo.findOne({ where: { id } });
        if (!content) {
            throw new NotFoundException('Content not found');
        }
        if (dto.title !== undefined) content.title = dto.title;
        if (dto.content !== undefined) content.content = dto.content;
        if (dto.isPublished !== undefined) content.isPublished = dto.isPublished;
        return this.contentRepo.save(content);
    }

    async delete(id: string): Promise<void> {
        const result = await this.contentRepo.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException('Content not found');
        }
    }
}
