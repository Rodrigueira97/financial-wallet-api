import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { PrismaService } from '../database/prisma.service';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { TransactionType } from '../../generated/prisma/client';

describe('WalletService', () => {
  let service: WalletService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((cb: (client: unknown) => unknown) =>
      cb({
        user: {
          findUnique: (...args: unknown[]): unknown =>
            mockPrisma.user.findUnique(...args),
          update: (...args: unknown[]): unknown =>
            mockPrisma.user.update(...args),
        },
        transaction: {
          create: (...args: unknown[]): unknown =>
            mockPrisma.transaction.create(...args),
          findUnique: (...args: unknown[]): unknown =>
            mockPrisma.transaction.findUnique(...args),
          update: (...args: unknown[]): unknown =>
            mockPrisma.transaction.update(...args),
        },
      }),
    ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    jest.clearAllMocks();
  });

  it('deve permitir depósito válido', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user1', balance: 0 });
    mockPrisma.user.update.mockResolvedValue({});
    mockPrisma.transaction.create.mockResolvedValue({
      id: 'tx1',
      type: TransactionType.DEPOSIT,
    });

    const result = await service.deposit('user1', { amount: 100 });
    expect(result).toHaveProperty('id', 'tx1');
    expect(mockPrisma.user.update).toHaveBeenCalled();
    expect(mockPrisma.transaction.create).toHaveBeenCalled();
  });

  it('deve bloquear depósito se saldo negativo', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user1', balance: -10 });
    await expect(service.deposit('user1', { amount: 100 })).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('deve permitir transferência válida', async () => {
    mockPrisma.user.findUnique
      .mockResolvedValueOnce({ id: 'from', balance: 200 })
      .mockResolvedValueOnce({ id: 'to', balance: 0 });
    mockPrisma.user.update.mockResolvedValue({});
    mockPrisma.transaction.create.mockResolvedValue({
      id: 'tx2',
      type: TransactionType.TRANSFER,
    });

    const result = await service.transfer('from', {
      toUserId: 'to',
      amount: 50,
    });
    expect(result).toHaveProperty('id', 'tx2');
    expect(mockPrisma.user.update).toHaveBeenCalledTimes(2);
    expect(mockPrisma.transaction.create).toHaveBeenCalled();
  });

  it('deve bloquear transferência se saldo insuficiente', async () => {
    mockPrisma.user.findUnique
      .mockResolvedValueOnce({ id: 'from', balance: 10 })
      .mockResolvedValueOnce({ id: 'to', balance: 0 });
    await expect(
      service.transfer('from', { toUserId: 'to', amount: 50 }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('deve bloquear transferência se saldo negativo', async () => {
    mockPrisma.user.findUnique
      .mockResolvedValueOnce({ id: 'from', balance: -5 })
      .mockResolvedValueOnce({ id: 'to', balance: 0 });
    await expect(
      service.transfer('from', { toUserId: 'to', amount: 1 }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('deve bloquear reversão se transação não encontrada', async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue(null);
    await expect(
      service.reverse('user1', { transactionId: 'tx3' }),
    ).rejects.toThrow(BadRequestException);
  });
});
