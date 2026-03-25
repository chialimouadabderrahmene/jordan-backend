import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
} from 'typeorm';

@Entity('otp_codes')
export class OtpCode {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column()
    email: string;

    @Column()
    codeHash: string;

    @Column({ type: 'timestamp' })
    expiresAt: Date;

    @Column({ type: 'int', default: 0 })
    attempts: number;

    @Column({ default: false })
    used: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
