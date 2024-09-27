import { Body, Controller, Post, Request } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { AuthResponse } from '../types/auth-response.type';
import { LocalAuth } from '../decorators/local-guard.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @LocalAuth()
  @Post('login')
  async login(@Request() req: any): Promise<AuthResponse> {
    return this.authService.login(req.user);
  }

  @Post('register')
  async register(@Body() body: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(body);
  }
}
