import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SuccessStory, SuccessStoryStatus } from '../../database/entities/success-story.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class SuccessStoriesService {
    private readonly logger = new Logger(SuccessStoriesService.name);

    constructor(
        @InjectRepository(SuccessStory)
        private readonly storyRepository: Repository<SuccessStory>,
    ) { }

    async submitStory(
        userId: string,
        dto: { story: string; title?: string; partnerId?: string; isAnonymous?: boolean; showNames?: boolean; showPhoto?: boolean },
    ): Promise<SuccessStory> {
        const story = this.storyRepository.create({
            userId,
            story: dto.story,
            title: dto.title,
            partnerId: dto.partnerId,
            isAnonymous: dto.isAnonymous ?? false,
            showNames: dto.showNames ?? true,
            showPhoto: dto.showPhoto ?? false,
            status: SuccessStoryStatus.PENDING,
        });
        return this.storyRepository.save(story);
    }

    async getApprovedStories(pagination: PaginationDto) {
        try {
            const [stories, total] = await this.storyRepository.findAndCount({
                where: { status: SuccessStoryStatus.APPROVED },
                relations: ['user', 'partner'],
                order: { createdAt: 'DESC' },
                skip: pagination.skip,
                take: pagination.limit,
            });

            return {
                stories: this.sanitizeStories(stories),
                total,
                page: pagination.page,
                limit: pagination.limit,
            };
        } catch (error) {
            this.logger.error(
                'Failed to load success stories with relations, falling back to relationless query',
                error instanceof Error ? error.stack : String(error),
            );

            const [stories, total] = await this.storyRepository.findAndCount({
                where: { status: SuccessStoryStatus.APPROVED },
                order: { createdAt: 'DESC' },
                skip: pagination.skip,
                take: pagination.limit,
            });

            return {
                stories: this.sanitizeStories(stories),
                total,
                page: pagination.page,
                limit: pagination.limit,
            };
        }
    }

    private sanitizeStories(stories: SuccessStory[]) {
        return stories.map((s) => ({
            id: s.id,
            userId: s.userId,
            partnerId: s.partnerId,
            title: s.title,
            story: s.story,
            photoUrl: s.showPhoto ? s.photoUrl : null,
            status: s.status,
            isAnonymous: s.isAnonymous,
            showNames: s.showNames,
            showPhoto: s.showPhoto,
            likes: s.likes,
            createdAt: s.createdAt,
            user: s.isAnonymous || !s.showNames || !s.user
                ? null
                : {
                    firstName: s.user.firstName,
                    lastName: s.user.lastName,
                },
            partner: s.isAnonymous || !s.showNames || !s.partner
                ? null
                : {
                    firstName: s.partner.firstName,
                    lastName: s.partner.lastName,
                },
        }));
    }

    async likeStory(storyId: string): Promise<void> {
        await this.storyRepository.increment({ id: storyId, status: SuccessStoryStatus.APPROVED }, 'likes', 1);
    }

    async getMyStories(userId: string) {
        return this.storyRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }

    async getPendingStories(pagination: PaginationDto) {
        const [stories, total] = await this.storyRepository.findAndCount({
            where: { status: SuccessStoryStatus.PENDING },
            relations: ['user', 'partner'],
            order: { createdAt: 'DESC' },
            skip: pagination.skip,
            take: pagination.limit,
        });
        return { stories, total, page: pagination.page, limit: pagination.limit };
    }

    async moderateStory(storyId: string, status: SuccessStoryStatus, moderatorNote?: string): Promise<SuccessStory> {
        const story = await this.storyRepository.findOne({ where: { id: storyId } });
        if (!story) throw new NotFoundException('Story not found');

        story.status = status;
        if (moderatorNote) story.moderatorNote = moderatorNote;
        return this.storyRepository.save(story);
    }
}

