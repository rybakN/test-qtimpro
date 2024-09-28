import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { getTypeOrmModuleAsyncOptions } from './options-functions/typeOrmModule-options.function';
import { getCacheModuleOptions } from './options-functions/cacheModule-options.function';

@Module({
  imports: [
    TypeOrmModule.forRootAsync(getTypeOrmModuleAsyncOptions()),
    CacheModule.registerAsync(getCacheModuleOptions()),
  ],
})
export class CoreModule {}
