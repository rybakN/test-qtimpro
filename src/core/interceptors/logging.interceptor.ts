import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, tap, throwError } from 'rxjs';

export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();

    const req = context.switchToHttp().getRequest();
    const { url, method, ip } = req;

    this.logger.log(`Incoming Request: ${method} ${url} from ${ip}`);

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const { statusCode } = response.statusCode;
        const contentLength = response.get('content-length');

        this.logger.log(
          `Outgoing Response: ${method} ${url} ${statusCode} ${contentLength || 0} - ${
            Date.now() - now
          }ms`,
        );
      }),
      catchError((err) => {
        this.logger.error(
          `Error Response: ${method} ${url} - ${err.status || HttpStatus.INTERNAL_SERVER_ERROR} - ${
            err.message
          }`,
        );
        return throwError(() => err);
      }),
    );
  }
}
