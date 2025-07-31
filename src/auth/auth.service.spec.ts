import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { RegisterDTO, LoginDTO } from './auth.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { UsersRepository } from '../repositories/user/users-repository';

class UsersRepositoryMock extends UsersRepository {
  findByEmail = jest.fn();
  create = jest.fn();
}

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: UsersRepositoryMock;
  let jwtService: { signAsync: jest.Mock; verifyAsync: jest.Mock };

  beforeEach(async () => {
    usersRepository = new UsersRepositoryMock();
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('access-token'),
      verifyAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersRepository, useValue: usersRepository },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('deve registrar novo usuário com sucesso', async () => {
    usersRepository.findByEmail.mockResolvedValue(null);
    usersRepository.create.mockResolvedValue(undefined);
    jest
      .spyOn(bcrypt, 'hash')
      .mockImplementation(() => Promise.resolve('hashed' as never));

    const result = await service.register({
      name: 'Test',
      email: 'test@email.com',
      password: '123456',
    } as RegisterDTO);
    expect(usersRepository.create).toHaveBeenCalledWith({
      name: 'Test',
      email: 'test@email.com',
      password: 'hashed',
    });
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
  });

  it('deve lançar erro se email já cadastrado', async () => {
    usersRepository.findByEmail.mockResolvedValue({ id: '1' });
    await expect(
      service.register({
        name: 'Test',
        email: 'test@email.com',
        password: '123456',
      } as RegisterDTO),
    ).rejects.toThrow(ConflictException);
  });

  it('deve autenticar usuário com sucesso', async () => {
    usersRepository.findByEmail.mockResolvedValue({
      id: '1',
      email: 'test@email.com',
      password: 'hashed',
    });
    jest
      .spyOn(bcrypt, 'compare')
      .mockImplementation(() => Promise.resolve(true as never));
    const result = await service.login({
      email: 'test@email.com',
      password: '123456',
    } as LoginDTO);
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
  });

  it('deve lançar erro se usuário não existe', async () => {
    usersRepository.findByEmail.mockResolvedValue(null);
    await expect(
      service.login({ email: 'notfound@email.com', password: '123456' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('deve lançar erro se senha inválida', async () => {
    usersRepository.findByEmail.mockResolvedValue({
      id: '1',
      email: 'test@email.com',
      password: 'hashed',
    });
    jest
      .spyOn(bcrypt, 'compare')
      .mockImplementation(() => Promise.resolve(false as never));
    await expect(
      service.login({ email: 'test@email.com', password: 'wrong' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  describe('refreshToken', () => {
    const refreshToken = 'refresh.jwt.token';
    const user = {
      id: '1',
      email: 'test@email.com',
      name: 'Test',
      balance: 10,
      password: 'hashed',
    };

    it('deve retornar novo access token e o mesmo refresh token', async () => {
      jwtService.verifyAsync.mockResolvedValue({ email: user.email });
      usersRepository.findByEmail.mockResolvedValue(user);
      const result = await service.refreshToken(refreshToken);
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          balance: user.balance,
        },
      });
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(refreshToken);
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { email: user.email },
        { expiresIn: '30m' },
      );
    });

    it('deve lançar UnauthorizedException se refresh token for inválido', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('invalid'));
      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve lançar UnauthorizedException se usuário não encontrado', async () => {
      jwtService.verifyAsync.mockResolvedValue({ email: user.email });
      usersRepository.findByEmail.mockResolvedValue(null);
      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
