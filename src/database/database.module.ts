import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

const dbLogger = new Logger('DatabaseModule');

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                let databaseUrl = configService.get<string>('database.url');
                const dbHost = configService.get<string>('database.host');

                // Auto-rewrite any direct Supabase connection to the IPv4 pooler
                // Railway cannot reach IPv6-only Supabase direct hosts
                if (databaseUrl?.includes('db.hjojxhcuokbflvemztji.supabase.co')) {
                    const parsed = new URL(databaseUrl);
                    const password = parsed.password;
                    const dbName = parsed.pathname.replace('/', '') || 'postgres';
                    databaseUrl = `postgresql://postgres.hjojxhcuokbflvemztji:${password}@aws-0-eu-west-1.pooler.supabase.com:6543/${dbName}?pgbouncer=true&sslmode=require`;
                    dbLogger.log(`Auto-rewritten DATABASE_URL to IPv4 pooler (aws-0-eu-west-1.pooler.supabase.com:6543)`);
                }

                let connectionConfig: any;

                if (databaseUrl) {
                    dbLogger.log(`Using DATABASE_URL (host: ${new URL(databaseUrl).hostname})`);
                    connectionConfig = { url: databaseUrl };
                } else if (dbHost?.includes('.supabase.co')) {
                    const poolerUrl = `postgresql://postgres.hjojxhcuokbflvemztji:${configService.get<string>('database.password')}@aws-0-eu-west-1.pooler.supabase.com:6543/${configService.get<string>('database.name')}?pgbouncer=true&sslmode=require`;
                    dbLogger.log(`Auto-rewriting DB_HOST to pooler (aws-0-eu-west-1.pooler.supabase.com:6543)`);
                    connectionConfig = { url: poolerUrl };
                } else {
                    dbLogger.log(`Using individual DB vars (host: ${dbHost})`);
                    connectionConfig = {
                        host: dbHost,
                        port: configService.get<number>('database.port'),
                        username: configService.get<string>('database.username'),
                        password: configService.get<string>('database.password'),
                        database: configService.get<string>('database.name'),
                    };
                }

                return {
                    type: 'postgres',
                    ...connectionConfig,
                    ssl: { rejectUnauthorized: false },
                    autoLoadEntities: true,
                    synchronize: process.env.NODE_ENV !== 'production',
                    logging: process.env.NODE_ENV === 'development',
                    entities: [__dirname + '/entities/**/*.entity{.ts,.js}'],
                    retryAttempts: 3,
                    retryDelay: 3000,
                };
            },
        }),
    ],
})
export class DatabaseModule { }
