import { Injectable, Logger, NestMiddleware } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('Request');

  private getLog(
    ip,
    method,
    originalUrl,
    statusCode,
    timeTaken,
    contentLength,
    userAgent,
  ) {
    const baseLog = `[${method}] ${originalUrl} Status: ${statusCode} CPU Time: ${timeTaken}ms Content Length: ${contentLength}`;
    const isLocalEnv = process.env.NODE_ENV === 'development';

    return isLocalEnv
      ? baseLog
      : `${baseLog} - UserAgent: ${userAgent} IP Address: ${ip}`;
  }

  use(req: any, res: any, next: () => void) {
    const { ip, method, originalUrl } = req;

    const userAgent = req.get('user-agent') || '';
    const startTime = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;

      const contentLength = res.get('content-length');

      const timeTaken = Date.now() - startTime;

      this.logger.log(
        this.getLog(
          ip,
          method,
          originalUrl,
          statusCode,
          timeTaken,
          contentLength,
          userAgent,
        ),
      );
    });

    next();
  }
}
