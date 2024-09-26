import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CoreModule } from './core/core.module';
import { BusinessModule } from './business/business.module';
import configuration from './core/configuration/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    CoreModule,
    BusinessModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
