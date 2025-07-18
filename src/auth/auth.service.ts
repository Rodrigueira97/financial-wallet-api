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

    return this.generateTokens(email);
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

    return this.generateTokens(email);
  }

  private async generateTokens(email: string) {
    const payload = { email };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '30m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }
}
