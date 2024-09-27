import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}
  async create(createUserDto: CreateUserDto) {
    const user = this.userRepository.create(createUserDto);
    return plainToClass(User, this.userRepository.save(user));
  }

  async findOneByUsername(username: string): Promise<User | null> {
    const user = await this.userRepository.findOneBy({ username });
    if (!user) {
      return user;
    }

    return user;
  }

  async findOneById(id: number): Promise<Omit<User, 'password'> | null> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      return user;
    }

    return plainToClass(User, user);
  }
}
