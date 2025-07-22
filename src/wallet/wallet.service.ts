import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { DepositDTO, TransferDTO, ReverseDTO } from './wallet.dto';
import {
  TransactionType,
  TransactionStatus,
  Transaction,
} from '../../generated/prisma';
import { PrismaService } from '../database/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { WalletErrors } from './wallet.errors';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private prisma: PrismaService) {}

  async deposit(userId: string, { amount }: DepositDTO): Promise<Transaction> {
    this.logger.log(`Usuário ${userId} solicitou depósito de ${amount}`);

    return this.prisma.$transaction(async (client) => {
      const user = await client.user.findUnique({ where: { id: userId } });

      if (!user) {
        this.logger.warn(`Usuário ${userId} não encontrado para depósito.`);
        throw new BadRequestException(WalletErrors.USER_NOT_FOUND);
      }

      if (new Decimal(user.balance).lt(0)) {
        this.logger.warn(
          `Depósito bloqueado para usuário ${userId}: saldo negativo.`,
        );

        throw new ForbiddenException(WalletErrors.BLOCKED_DEPOSIT);
      }

      await client.user.update({
        where: { id: userId },
        data: { balance: { increment: amount } },
      });

      const transaction = await client.transaction.create({
        data: {
          type: TransactionType.DEPOSIT,
          amount,
          toUserId: userId,
          status: TransactionStatus.COMPLETED,
        },
      });

      this.logger.log(
        `Depósito realizado para usuário ${userId}, transação ${transaction.id}`,
      );

      return transaction;
    });
  }

  async transfer(
    fromUserId: string,
    { amount, toUserId }: TransferDTO,
  ): Promise<Transaction> {
    this.logger.log(
      `Usuário ${fromUserId} solicitou transferência de ${amount} para ${toUserId}`,
    );

    return this.prisma.$transaction(async (client) => {
      const fromUser = await client.user.findUnique({
        where: { id: fromUserId },
      });

      const toUser = await client.user.findUnique({
        where: { id: toUserId },
      });

      if (!fromUser || !toUser) {
        this.logger.warn(WalletErrors.TRANSFER_FAILED);

        throw new BadRequestException('Usuário não encontrado');
      }

      if (new Decimal(fromUser.balance).lt(amount)) {
        this.logger.warn(
          `Transferência bloqueada: saldo insuficiente para usuário ${fromUserId}`,
        );

        throw new ForbiddenException(WalletErrors.INSUFFCIENT_BALANCE);
      }

      if (new Decimal(fromUser.balance).lt(0)) {
        this.logger.warn(
          `Transferência bloqueada: saldo negativo para usuário ${fromUserId}`,
        );

        throw new ForbiddenException(WalletErrors.TRANSFER_BLOCKED);
      }

      await client.user.update({
        where: { id: fromUserId },
        data: { balance: { decrement: amount } },
      });

      await client.user.update({
        where: { id: toUserId },
        data: { balance: { increment: amount } },
      });

      const transaction = await client.transaction.create({
        data: {
          type: TransactionType.TRANSFER,
          amount,
          fromUserId,
          toUserId,
          status: TransactionStatus.COMPLETED,
        },
      });

      this.logger.log(
        `Transferência realizada: ${fromUserId} -> ${toUserId}, transação ${transaction.id}`,
      );

      return transaction;
    });
  }

  async reverse(
    userId: string,
    { transactionId }: ReverseDTO,
  ): Promise<Transaction> {
    this.logger.log(
      `Usuário ${userId} solicitou reversão da transação ${transactionId}`,
    );

    return this.prisma.$transaction(async (client) => {
      const transactionOriginal = await client.transaction.findUnique({
        where: { id: transactionId },
      });

      if (!transactionOriginal) {
        this.logger.warn(
          `Reversão falhou: transação ${transactionId} não encontrada.`,
        );

        throw new BadRequestException(WalletErrors.TRANSACTION_NOT_FOUND);
      }

      if (transactionOriginal.status === TransactionStatus.REVERSED) {
        this.logger.warn(
          `Reversão já realizada para transação ${transactionId}`,
        );

        throw new BadRequestException(
          WalletErrors.TRANSACTION_ALREADY_REVERSED,
        );
      }

      if (
        transactionOriginal.fromUserId !== userId &&
        transactionOriginal.toUserId !== userId
      ) {
        this.logger.warn(
          `Usuário ${userId} tentou reverter transação sem permissão (${transactionId})`,
        );

        throw new ForbiddenException(WalletErrors.NO_PERMISSION_TO_REVERT);
      }

      if (transactionOriginal.type === TransactionType.DEPOSIT) {
        await client.user.update({
          where: { id: transactionOriginal.toUserId! },
          data: { balance: { decrement: transactionOriginal.amount } },
        });
      }

      if (transactionOriginal.type === TransactionType.TRANSFER) {
        await client.user.update({
          where: { id: transactionOriginal.fromUserId! },
          data: { balance: { increment: transactionOriginal.amount } },
        });

        await client.user.update({
          where: { id: transactionOriginal.toUserId! },
          data: { balance: { decrement: transactionOriginal.amount } },
        });
      }

      await client.transaction.update({
        where: { id: transactionOriginal.id },
        data: { status: TransactionStatus.REVERSED, reversedAt: new Date() },
      });

      const reversal = await client.transaction.create({
        data: {
          type: TransactionType.REVERSAL,
          amount: transactionOriginal.amount,
          fromUserId: transactionOriginal.toUserId,
          toUserId: transactionOriginal.fromUserId,
          status: TransactionStatus.COMPLETED,
          reversalReferenceId: transactionOriginal.id,
        },
      });

      this.logger.log(
        `Reversão realizada: transação ${transactionId} revertida por ${userId}, nova transação ${reversal.id}`,
      );

      return reversal;
    });
  }
}
