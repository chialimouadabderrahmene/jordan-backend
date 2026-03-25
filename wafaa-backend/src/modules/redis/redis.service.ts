import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

/**
 * No-op Redis service stub.
 * All methods return immediately with sensible defaults.
 * Redis is fully disabled — no network calls, no reconnect loops.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
    private readonly logger = new Logger(RedisService.name);

    constructor() {
        this.logger.warn('Redis is DISABLED — using no-op stub (all calls return immediately)');
    }

    async onModuleDestroy() {
        // Nothing to clean up
    }

    async get(_key: string): Promise<string | null> {
        return null;
    }

    async set(_key: string, _value: string, _ttlSeconds?: number): Promise<void> {
        // no-op
    }

    async del(_key: string): Promise<void> {
        // no-op
    }

    async setJson(_key: string, _value: any, _ttlSeconds?: number): Promise<void> {
        // no-op
    }

    async getJson<T>(_key: string): Promise<T | null> {
        return null;
    }

    async exists(_key: string): Promise<boolean> {
        return false;
    }

    async expire(_key: string, _ttlSeconds: number): Promise<void> {
        // no-op
    }

    async incr(_key: string): Promise<number> {
        return 1;
    }

    async sadd(_key: string, ..._members: string[]): Promise<void> {
        // no-op
    }

    async srem(_key: string, ..._members: string[]): Promise<void> {
        // no-op
    }

    async smembers(_key: string): Promise<string[]> {
        return [];
    }

    async sismember(_key: string, _member: string): Promise<boolean> {
        return false;
    }

    // Online presence — no-op
    async setUserOnline(_userId: string): Promise<void> { }
    async setUserOffline(_userId: string): Promise<void> { }

    async isUserOnline(_userId: string): Promise<boolean> {
        return false;
    }

    async getOnlineUsers(): Promise<string[]> {
        return [];
    }

    // Rate limiting — always allow
    async checkRateLimit(
        _key: string,
        _limit: number,
        _windowSeconds: number,
    ): Promise<boolean> {
        return true;
    }
}
