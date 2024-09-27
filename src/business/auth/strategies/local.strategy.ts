import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../services/auth.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { LoginDto } from '../dto/login.dto';
import { validate } from 'class-validator';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super();
  }

  async validate(username: string, password: string): Promise<any> {
    const loginDto = plainToClass(LoginDto, {
      username,
      password,
    });
    const validateErrors = await this.validateLoginDto(loginDto);
    if (validateErrors) {
      throw new UnauthorizedException(validateErrors);
    }
    const user = await this.authService.validateUser({ username, password });
    if (!user) {
      throw new UnauthorizedException('Invalid login or password');
    }
    return user;
  }

  private async validateLoginDto(loginDto: LoginDto) {
    const errors = await validate(loginDto);
    if (errors.length) {
      return errors.map((error) => error.constraints);
    }
    return null;
  }
}
