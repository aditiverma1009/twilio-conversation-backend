import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation } from '@nestjs/swagger';

interface RegisterDto {
  email: string;
  password: string;
  username: string;
}

interface LoginDto {
  username: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() registerDto: RegisterDto) {
    const response = await this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.username,
    );
    return response;
  }

  @Post('login')
  @ApiOperation({ summary: 'Login into application' })
  async login(@Body() loginDto: LoginDto) {
    const response = await this.authService.login(
      loginDto.username,
      loginDto.password,
    );
    return response;
  }
}
