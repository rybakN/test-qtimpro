import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../../users/services/users.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ConflictException } from '@nestjs/common';
import { RegisterDto } from '../dto/register.dto';
import { User } from '../../users/entities/user.entity';
import { LoginDto } from '../dto/login.dto';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: Partial<UsersService>;
  let configService: Partial<ConfigService>;
  let jwtService: Partial<JwtService>;

  beforeEach(async () => {
    usersService = {
      findOneByUsername: jest.fn(),
      create: jest.fn(),
    };

    configService = {
      get: jest.fn().mockReturnValue(10),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mockToken'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: ConfigService, useValue: configService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should throw ConflictException if user already exists', async () => {
      (usersService.findOneByUsername as jest.Mock).mockResolvedValue({
        id: 1,
      });

      const registerDto: RegisterDto = {
        username: 'testuser',
        password: 'password',
      };

      await expect(authService.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should create a new user', async () => {
      (usersService.findOneByUsername as jest.Mock).mockResolvedValue(null);
      (usersService.create as jest.Mock).mockResolvedValue({
        id: 1,
        username: 'testuser',
      });

      (jest.spyOn(bcrypt, 'hash') as jest.Mock).mockResolvedValue(
        'hashedPassword',
      );

      const registerDto: RegisterDto = {
        username: 'testuser',
        password: 'password',
      };

      const result = await authService.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('password', 10);
      expect(usersService.create).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'hashedPassword',
      });
      expect(result).toBeUndefined();
    });
  });

  describe('login', () => {
    it('should return the token on successful login', async () => {
      const user: User = { id: 1, username: 'testuser' } as User;

      const result = await authService.login(user);

      expect(jwtService.sign).toHaveBeenCalledWith({
        username: 'testuser',
        sub: 1,
      });
      expect(result).toEqual({ accessToken: 'mockToken' });
    });
  });

  describe('validateUser', () => {
    it('should return the user on successful validation', async () => {
      const user = { id: 1, username: 'testuser', password: 'hashedPassword' };
      (usersService.findOneByUsername as jest.Mock).mockResolvedValue(user);
      (jest.spyOn(bcrypt, 'compare') as jest.Mock).mockResolvedValue(true);

      const loginDto: LoginDto = { username: 'testuser', password: 'password' };

      const result = await authService.validateUser(loginDto);

      expect(usersService.findOneByUsername).toHaveBeenCalledWith('testuser');
      expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashedPassword');
      expect(result).toEqual(
        expect.objectContaining({ id: 1, username: 'testuser' }),
      );
    });

    it('should return null if validation fails', async () => {
      (usersService.findOneByUsername as jest.Mock).mockResolvedValue(null);

      const loginDto: LoginDto = { username: 'testuser', password: 'password' };

      const result = await authService.validateUser(loginDto);

      expect(usersService.findOneByUsername).toHaveBeenCalledWith('testuser');
      expect(result).toBeNull();
    });
  });

  describe('checkUserExists', () => {
    it('should return true if the user exists', async () => {
      (usersService.findOneByUsername as jest.Mock).mockResolvedValue({
        id: 1,
      });

      const result = await authService.checkUserExists('testuser');

      expect(usersService.findOneByUsername).toHaveBeenCalledWith('testuser');
      expect(result).toBe(true);
    });

    it('should return false if the user does not exist', async () => {
      (usersService.findOneByUsername as jest.Mock).mockResolvedValue(null);

      const result = await authService.checkUserExists('testuser');

      expect(usersService.findOneByUsername).toHaveBeenCalledWith('testuser');
      expect(result).toBe(false);
    });
  });
});
