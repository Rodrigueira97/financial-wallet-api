import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DepositDto, TransferDto, ReverseDto } from './wallet.dto';
import {
  TransactionType,
  TransactionStatus,
  Transaction,
} from '../../generated/prisma';
import { PrismaService } from '../database/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async deposit(userId: string, dto: DepositDto): Promise<Transaction> {
    return this.prisma.$transaction(async (client) => {
      const user = await client.user.findUnique({ where: { id: userId } });

      if (!user) throw new BadRequestException('Usuário não encontrado');

      if (new Decimal(user.balance).lt(0))
        throw new ForbiddenException('Depósito bloqueado: saldo negativo');

      await client.user.update({
        where: { id: userId },
        data: { balance: { increment: dto.amount } },
      });

      return client.transaction.create({
        data: {
          type: TransactionType.DEPOSIT,
          amount: dto.amount,
          toUserId: userId,
          status: TransactionStatus.COMPLETED,
        },
      });
    });
  }

  async transfer(fromUserId: string, dto: TransferDto): Promise<Transaction> {
    return this.prisma.$transaction(async (client) => {
      const fromUser = await client.user.findUnique({
        where: { id: fromUserId },
      });

      const toUser = await client.user.findUnique({
        where: { id: dto.toUserId },
      });

      if (!fromUser || !toUser)
        throw new BadRequestException('Usuário não encontrado');

      if (new Decimal(fromUser.balance).lt(dto.amount))
        throw new ForbiddenException('Saldo insuficiente');

      if (new Decimal(fromUser.balance).lt(0))
        throw new ForbiddenException('Transferência bloqueada: saldo negativo');

      await client.user.update({
        where: { id: fromUserId },
        data: { balance: { decrement: dto.amount } },
      });

      await client.user.update({
        where: { id: dto.toUserId },
        data: { balance: { increment: dto.amount } },
      });

      return client.transaction.create({
        data: {
          type: TransactionType.TRANSFER,
          amount: dto.amount,
          fromUserId,
          toUserId: dto.toUserId,
          status: TransactionStatus.COMPLETED,
        },
      });
    });
  }

  async reverse(userId: string, dto: ReverseDto): Promise<Transaction> {
    return this.prisma.$transaction(async (client) => {
      const original = await client.transaction.findUnique({
        where: { id: dto.transactionId },
      });

      if (!original) throw new BadRequestException('Transação não encontrada');

      if (original.status === TransactionStatus.REVERSED)
        throw new BadRequestException('Transação já revertida');

      if (original.fromUserId !== userId && original.toUserId !== userId)
        throw new ForbiddenException('Sem permissão para reverter');

      if (original.type === TransactionType.DEPOSIT) {
        await client.user.update({
          where: { id: original.toUserId! },
          data: { balance: { decrement: original.amount } },
        });
      }

      if (original.type === TransactionType.TRANSFER) {
        await client.user.update({
          where: { id: original.fromUserId! },
          data: { balance: { increment: original.amount } },
        });

        await client.user.update({
          where: { id: original.toUserId! },
          data: { balance: { decrement: original.amount } },
        });
      }

      await client.transaction.update({
        where: { id: original.id },
        data: { status: TransactionStatus.REVERSED, reversedAt: new Date() },
      });

      return client.transaction.create({
        data: {
          type: TransactionType.REVERSAL,
          amount: original.amount,
          fromUserId: original.toUserId,
          toUserId: original.fromUserId,
          status: TransactionStatus.COMPLETED,
          reversalReferenceId: original.id,
        },
      });
    });
  }
}
