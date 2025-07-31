import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { RegisterDTO, LoginDTO } from './auth.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { AuthErrors } from './auth.errors';
import { UsersRepository } from '../repositories/user/users-repository';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersRepository: UsersRepository,
    private jwtService: JwtService,
  ) {}

  async register({ email, name, password }: RegisterDTO) {
    this.logger.log(`Tentativa de registro para email: ${email}`);

    const existing = await this.usersRepository.findByEmail(email);

    if (existing) {
      this.logger.warn(`Registro bloqueado: email já cadastrado (${email})`);

      throw new ConflictException(AuthErrors.EMAIL_ALREADY_REGISTERED);
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    await this.usersRepository.create({
      name,
      email,
      password: hashedPassword,
    });

    this.logger.log(`Usuário registrado com sucesso: ${email}`);

    const createdUser = await this.usersRepository.findByEmail(email);

    const user = {
      id: createdUser?.id ?? '',
      name,
      email,
      balance: 0,
    };
    return this.generateTokens(user);
  }

  async login({ email, password }: LoginDTO) {
    this.logger.log(`Tentativa de login para email: ${email}`);

    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      this.logger.warn(`Login falhou: usuário não encontrado (${email})`);

      throw new UnauthorizedException(AuthErrors.INVALID_CREDENTIALS);
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      this.logger.warn(`Login falhou: senha inválida para email ${email}`);
      throw new UnauthorizedException(AuthErrors.INVALID_CREDENTIALS);
    }

    this.logger.log(`Login realizado com sucesso: ${email}`);

    return this.generateTokens({
      id: user.id,
      email: user.email,
      name: user.name,
      balance: Number(user.balance),
    });
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<{ email: string }>(
        refreshToken,
      );
      const user = await this.usersRepository.findByEmail(payload.email);
      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      const accessToken = await this.jwtService.signAsync(
        { email: user.email },
        { expiresIn: '30m' },
      );
      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          balance: Number(user.balance),
        },
      };
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }
  }

  private async generateTokens(user: {
    id: string;
    email: string;
    name: string;
    balance: number;
  }) {
    const payload = { email: user.email };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '30m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });

    return { accessToken, refreshToken, user };
  }
}
