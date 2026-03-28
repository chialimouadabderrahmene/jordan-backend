import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum JobType {
    FULL_TIME = 'full_time',
    PART_TIME = 'part_time',
    CONTRACT = 'contract',
    REMOTE = 'remote',
    INTERNSHIP = 'internship',
}

@Entity('job_vacancies')
export class JobVacancy {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ nullable: true })
    requirements: string;

    @Column({ nullable: true })
    benefits: string;

    @Column({ type: 'enum', enum: JobType, default: JobType.FULL_TIME })
    type: JobType;

    @Column({ nullable: true })
    location: string;

    @Column({ nullable: true })
    department: string;

    @Column({ nullable: true })
    salaryRange: string;

    @Column({ nullable: true })
    applicationUrl: string;

    @Column({ nullable: true })
    applicationEmail: string;

    @Column({ default: true })
    isActive: boolean;

    @Column({ default: 'en' })
    locale: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
