import { ConfigService } from '@nestjs/config';
import { RedisClientType } from 'redis';
import { CacheModuleAsyncOptions } from '@nestjs/cache-manager';
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

export const getCacheModuleOptions = (): CacheModuleAsyncOptions<{
  store: RedisStore<RedisClientType>;
}> => ({
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const redisHost = configService.get<string>('redis.host');
    const redisPort = configService.get<number>('redis.port');
    const redisTtl = configService.get<number>('redis.ttl');

    if (!redisHost || !redisPort || !redisTtl) {
      throw new Error('Redis configuration is incomplete');
    }

    return {
      store: await redisStore({
        socket: {
          host: redisHost,
          port: redisPort,
        },
        ttl: redisTtl,
      }),
    };
  },
  isGlobal: true,
});
