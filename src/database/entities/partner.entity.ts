import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum PartnerType {
    SPONSOR = 'sponsor',
    AFFILIATE = 'affiliate',
    MEDIA = 'media',
    TECHNOLOGY = 'technology',
    COMMUNITY = 'community',
}

@Entity('partners')
export class Partner {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ nullable: true })
    logoUrl: string;

    @Column({ nullable: true })
    websiteUrl: string;

    @Column({ type: 'enum', enum: PartnerType, default: PartnerType.SPONSOR })
    type: PartnerType;

    @Column({ default: 0 })
    order: number;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
