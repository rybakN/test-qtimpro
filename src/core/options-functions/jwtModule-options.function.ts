import { JwtModuleAsyncOptions } from '@nestjs/jwt/dist/interfaces/jwt-module-options.interface';
import { ConfigService } from '@nestjs/config';

/**
 * Generates JWT module options for the NestJS application.
 *
 * @returns {JwtModuleAsyncOptions} The JWT module options.
 */
export const getJwtModuleAsyncOptions = (): JwtModuleAsyncOptions => ({
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const jwtSecret = configService.get<string>('jwt.secret');
    const jwtExpiresIn = configService.get<string>('jwt.expiresIn');

    if (!jwtSecret || !jwtExpiresIn) {
      throw new Error('JWT configuration is incomplete');
    }

    return {
      secret: jwtSecret,
      signOptions: {
        expiresIn: jwtExpiresIn,
      },
    };
  },
});
