import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { LedgerModule } from './modules/ledger/ledger.module';
import { LoggerMiddleware } from './middlewares/logger.middleware';

@Module({
  imports: [LedgerModule],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
