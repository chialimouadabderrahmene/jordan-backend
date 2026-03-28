import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

@Entity('faqs')
@Index(['category', 'locale'])
export class Faq {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    question: string;

    @Column({ type: 'text' })
    answer: string;

    @Column({ default: 'general' })
    category: string; // general, account, matching, subscription, safety, privacy

    @Column({ default: 'en' })
    locale: string;

    @Column({ default: 0 })
    order: number;

    @Column({ default: true })
    isPublished: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
