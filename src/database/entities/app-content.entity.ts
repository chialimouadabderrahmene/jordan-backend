import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

export enum ContentType {
    TERMS = 'terms',
    PRIVACY = 'privacy',
    ABOUT = 'about',
    FAQ = 'faq',
    PARTNERS = 'partners',
    JOBS = 'jobs',
    ACCESSIBILITY = 'accessibility',
    COMMUNITY_GUIDELINES = 'community_guidelines',
    SAFETY_TIPS = 'safety_tips',
    CONTACT_US = 'contact_us',
}

@Entity('app_content')
@Index(['type', 'locale'], { unique: true })
export class AppContent {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'enum', enum: ContentType })
    type: ContentType;

    @Column()
    title: string;

    @Column({ type: 'text' })
    content: string;

    @Column({ default: 'en' })
    locale: string;

    @Column({ default: true })
    isPublished: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
