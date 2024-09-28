import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm/dist/interfaces/typeorm-options.interface';

export const getTypeOrmModuleAsyncOptions = (): TypeOrmModuleAsyncOptions => ({
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const dbHost = configService.get<string>('database.host');
    const dbPort = configService.get<number>('database.port');
    const dbUsername = configService.get<string>('database.username');
    const dbPassword = configService.get<string>('database.password');
    const dbName = configService.get<string>('database.database');

    if (!dbHost || !dbPort || !dbUsername || !dbPassword || !dbName) {
      throw new Error('Database configuration is incomplete');
    }

    return {
      type: 'postgres',
      host: dbHost,
      port: dbPort,
      username: dbUsername,
      password: dbPassword,
      database: dbName,
      autoLoadEntities: true,
      synchronize: true,
    };
  },
});
