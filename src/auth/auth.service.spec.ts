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
  let jwtService: { signAsync: jest.Mock };

  beforeEach(async () => {
    usersRepository = new UsersRepositoryMock();
    jwtService = { signAsync: jest.fn().mockResolvedValue('token') };

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
});
