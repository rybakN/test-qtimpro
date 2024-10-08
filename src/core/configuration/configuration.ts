import { ConfigurationInterface } from './interfaces/configuration.interface';

export default (): ConfigurationInterface => ({
  app: {
    port: parseInt(process.env.APP_PORT) || 3000,
  },
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT) || 5432,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT) || 6379,
    ttl: parseInt(process.env.REDIS_TTL) || 600,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },
  bcrypt: {
    hashRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,
  },
});
