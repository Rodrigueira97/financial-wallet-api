import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDTO, LoginDTO, RefreshTokenDTO } from './auth.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário registrado com sucesso.' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado.' })
  async register(@Body() { email, name, password }: RegisterDTO) {
    return this.authService.register({ email, name, password });
  }

  @Post('login')
  @ApiOperation({ summary: 'Login do usuário' })
  @ApiResponse({ status: 201, description: 'Login realizado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  async login(@Body() { email, password }: LoginDTO) {
    return this.authService.login({ email, password });
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Renovar tokens de acesso',
    description: 'Gera novos tokens JWT a partir de um refresh token válido.',
  })
  @ApiResponse({ status: 201, description: 'Tokens renovados com sucesso.' })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido ou expirado.',
  })
  async refresh(@Body() { refreshToken }: RefreshTokenDTO) {
    return this.authService.refreshToken(refreshToken);
  }
}
