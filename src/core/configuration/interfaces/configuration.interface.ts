export interface ConfigurationInterface {
  app: AppCredentials;
  database: DatabaseCredentials;
  redis: RedisCredentials;
  jwt: JwtCredentials;
  bcrypt: BcryptCredentials;
}

type AppCredentials = {
  port: number;
};

type DatabaseCredentials = {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
};

type RedisCredentials = {
  host: string;
  port: number;
  ttl: number;
};

type JwtCredentials = {
  secret: string;
  expiresIn: string;
};

type BcryptCredentials = {
  hashRounds: number;
};
