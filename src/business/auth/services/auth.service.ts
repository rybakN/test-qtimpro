import { ConflictException, Injectable } from '@nestjs/common';
import { UsersService } from '../../users/services/users.service';
import { RegisterDto } from '../dto/register.dto';
import { User } from '../../users/entities/user.entity';
import { LoginDto } from '../dto/login.dto';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AuthResponse } from '../types/auth-response.type';
import { plainToClass } from 'class-transformer';
import { CreateToken } from '../types/create-token.type';

@Injectable()
export class AuthService {
  private readonly hashRounds: number;

  /**
   * Constructs a new AuthService.
   *
   * @param {UsersService} usersService - The service to manage user entities.
   * @param {ConfigService} configService - The service to manage configuration settings.
   * @param {JwtService} jwtService - The service to manage JWT tokens.
   */
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.hashRounds = this.configService.get('bcrypt.hashRounds');
  }

  /**
   * Registers a new user.
   *
   * @param {RegisterDto} body - The data transfer object containing registration details.
   * @returns {Promise<void>} A promise that resolves when the user is registered.
   * @throws {ConflictException} If a user with the given username already exists.
   */
  async register(body: RegisterDto): Promise<void> {
    const userExists = await this.usersService.findOneByUsername(body.username);
    if (userExists) {
      throw new ConflictException('User with this username already exists');
    }
    const hashPassword = await bcrypt.hash(body.password, this.hashRounds);
    const user = await this.usersService.create({
      ...body,
      password: hashPassword,
    });
  }

  /**
   * Logs in a user.
   *
   * @param {Omit<User, 'password'>} user - The user entity without the password.
   * @returns {Promise<AuthResponse>} The authentication response containing the access token.
   */
  async login(user: Omit<User, 'password'>): Promise<AuthResponse> {
    return this.createToken({ username: user.username, sub: user.id });
  }

  /**
   * Validates a user's credentials.
   *
   * @param {LoginDto} body - The data transfer object containing login details.
   * @returns {Promise<User | null>} The user entity if validation is successful, or null if not.
   */
  async validateUser(body: LoginDto): Promise<User | null> {
    const user = await this.usersService.findOneByUsername(body.username);
    if (user && (await bcrypt.compare(body.password, user.password))) {
      return plainToClass(User, user);
    }
    return null;
  }

  /**
   * Checks if a user exists by their username.
   *
   * @param {string} username - The username to check.
   * @returns {Promise<boolean>} True if the user exists, false otherwise.
   */
  async checkUserExists(username: string): Promise<boolean> {
    return Boolean(await this.usersService.findOneByUsername(username));
  }

  /**
   * Creates a JWT token.
   *
   * @param {CreateToken} payload - The payload to include in the token.
   * @returns {AuthResponse} The authentication response containing the access token.
   */
  private createToken(payload: CreateToken): AuthResponse {
    return { accessToken: this.jwtService.sign(payload) };
  }
}
