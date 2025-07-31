import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../database/prisma.service';
import { BadRequestException } from '@nestjs/common';

const mockUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  balance: 1000,
  status: 'ACTIVE',
  createdAt: new Date('2024-01-01T00:00:00Z'),
};

describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('deve retornar o perfil do usuário quando encontrado', async () => {
    jest
      .spyOn(prisma.user, 'findUnique')
      .mockResolvedValueOnce(mockUser as any);
    const result = await service.getProfile('user-1');
    expect(result).toEqual({
      id: mockUser.id,
      name: mockUser.name,
      email: mockUser.email,
      balance: mockUser.balance,
      status: mockUser.status,
      createdAt: mockUser.createdAt,
    });
  });

  it('deve lançar exceção se o usuário não for encontrado', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(null);
    await expect(service.getProfile('user-2')).rejects.toThrow(
      BadRequestException,
    );
  });
});
