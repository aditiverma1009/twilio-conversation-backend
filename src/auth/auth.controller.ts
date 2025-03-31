import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  @ApiOperation({ summary: 'Login into application' })
  async login(@Body() loginQuery: { email: string; password: string }) {
    const response = await this.authService.login(
      loginQuery.email,
      loginQuery.password,
    );
    return response;
  }
}
