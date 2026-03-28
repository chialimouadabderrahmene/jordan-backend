import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppContent } from '../../database/entities/app-content.entity';
import { Faq } from '../../database/entities/faq.entity';
import { JobVacancy } from '../../database/entities/job-vacancy.entity';
import { Partner } from '../../database/entities/partner.entity';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';

@Module({
    imports: [TypeOrmModule.forFeature([AppContent, Faq, JobVacancy, Partner])],
    controllers: [ContentController],
    providers: [ContentService],
    exports: [ContentService],
})
export class ContentModule {}
