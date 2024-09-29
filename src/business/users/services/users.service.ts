import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';

@Injectable()
export class UsersService {
  /**
   * Constructs a new UsersService.
   *
   * @param {Repository<User>} userRepository - The repository for user entities.
   */
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Creates a new user.
   *
   * @param {CreateUserDto} createUserDto - The data transfer object containing user creation details.
   * @returns {Promise<User>} The created user entity.
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return plainToClass(User, await this.userRepository.save(user));
  }

  /**
   * Finds a user by their username.
   *
   * @param {string} username - The username of the user to find.
   * @returns {Promise<User | null>} The user entity or null if not found.
   */
  async findOneByUsername(username: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ username });
  }

  /**
   * Finds a user by their ID.
   *
   * @param {number} id - The ID of the user to find.
   * @returns {Promise<Omit<User, 'password'> | null>} The user entity without the password or null if not found.
   */
  async findOneById(id: number): Promise<Omit<User, 'password'> | null> {
    const user = await this.userRepository.findOneBy({ id });
    return user ? plainToClass(User, user) : null;
  }
}
