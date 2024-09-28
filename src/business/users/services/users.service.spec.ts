import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateUserDto } from '../dto/create-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOneBy: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
  });

  describe('create', () => {
    it('should create and return a user', async () => {
      const createUserDto: CreateUserDto = {
        username: 'testuser',
        password: 'password123',
      };

      const userEntity = {
        username: 'testuser',
        password: 'password123',
      } as User;

      const savedUser = {
        id: 1,
        username: 'testuser',
        password: 'password123',
      } as User;

      // Mocking repository methods
      userRepository.create.mockReturnValue(userEntity);
      userRepository.save.mockResolvedValue(savedUser);

      const result = await service.create(createUserDto);

      expect(userRepository.create).toHaveBeenCalledWith(createUserDto);
      expect(userRepository.save).toHaveBeenCalledWith(userEntity);
      expect(result).toEqual(
        expect.objectContaining({ id: 1, username: 'testuser' }),
      );
    });
  });

  describe('findOneByUsername', () => {
    it('should return a user if found', async () => {
      const username = 'testuser';
      const user = {
        id: 1,
        username: 'testuser',
        password: 'password123',
      } as User;

      userRepository.findOneBy.mockResolvedValue(user);

      const result = await service.findOneByUsername(username);

      expect(userRepository.findOneBy).toHaveBeenCalledWith({ username });
      expect(result).toEqual(user);
    });

    it('should return null if user not found', async () => {
      const username = 'nonexistentuser';

      userRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findOneByUsername(username);

      expect(userRepository.findOneBy).toHaveBeenCalledWith({ username });
      expect(result).toBeNull();
    });
  });

  describe('findOneById', () => {
    it('should return a user without password if found', async () => {
      const id = 1;
      const user = {
        id: 1,
        username: 'testuser',
        password: 'password123',
      } as User;

      userRepository.findOneBy.mockResolvedValue(user);

      const result = await service.findOneById(id);

      expect(userRepository.findOneBy).toHaveBeenCalledWith({ id });
      expect(result).toEqual(
        expect.objectContaining({ id: 1, username: 'testuser' }),
      );
      expect(result).not.toHaveProperty('password');
    });

    it('should return null if user not found', async () => {
      const id = 999;

      userRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findOneById(id);

      expect(userRepository.findOneBy).toHaveBeenCalledWith({ id });
      expect(result).toBeNull();
    });
  });
});
