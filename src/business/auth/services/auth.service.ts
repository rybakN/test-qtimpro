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

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.hashRounds = this.configService.get('bcrypt.hashRounds');
  }

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

  async login(user: Omit<User, 'password'>): Promise<AuthResponse> {
    return this.createToken({ username: user.username, sub: user.id });
  }

  async validateUser(body: LoginDto): Promise<User | null> {
    const user = await this.usersService.findOneByUsername(body.username);
    if (user && (await bcrypt.compare(body.password, user.password))) {
      return plainToClass(User, user);
    }
    return null;
  }

  async checkUserExists(username: string): Promise<boolean> {
    return Boolean(await this.usersService.findOneByUsername(username));
  }

  private createToken(payload: CreateToken): AuthResponse {
    return { accessToken: this.jwtService.sign(payload) };
  }
}
