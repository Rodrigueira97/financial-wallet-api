import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { UsersRepository } from '../repositories/user/users-repository';
import { RegisterDto, LoginDto } from './auth.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { AuthErrors } from './auth.errors';

@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(AuthErrors.EMAIL_ALREADY_REGISTERED);
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    await this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
    });
    return this.generateTokens(dto.email);
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException(AuthErrors.INVALID_CREDENTIALS);
    }
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException(AuthErrors.INVALID_CREDENTIALS);
    }
    return this.generateTokens(dto.email);
  }

  private async generateTokens(email: string) {
    const payload = { email };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });
    return { accessToken, refreshToken };
  }
}
