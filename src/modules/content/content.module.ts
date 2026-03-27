import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppContent } from '../../database/entities/app-content.entity';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';

@Module({
    imports: [TypeOrmModule.forFeature([AppContent])],
    controllers: [ContentController],
    providers: [ContentService],
    exports: [ContentService],
})
export class ContentModule {}
