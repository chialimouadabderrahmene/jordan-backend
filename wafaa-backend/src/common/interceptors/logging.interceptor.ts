import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { tap, timeout, catchError } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(LoggingInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const method = request.method;
        const url = request.url;
        const now = Date.now();

        // Log request START immediately
        this.logger.log(`➡️  [REQUEST START] ${method} ${url}`);

        return next.handle().pipe(
            // 30-second timeout — if handler doesn't respond, force error
            timeout(30000),
            tap(() => {
                const responseTime = Date.now() - now;
                this.logger.log(`✅ [REQUEST END] ${method} ${url} — ${responseTime}ms`);
            }),
            catchError((err) => {
                const responseTime = Date.now() - now;
                if (err instanceof TimeoutError) {
                    this.logger.error(
                        `⏰ [REQUEST TIMEOUT] ${method} ${url} — stuck for ${responseTime}ms, KILLED`,
                    );
                } else {
                    this.logger.error(
                        `❌ [REQUEST ERROR] ${method} ${url} — ${responseTime}ms — ${err.message}`,
                    );
                }
                return throwError(() => err);
            }),
        );
    }
}
