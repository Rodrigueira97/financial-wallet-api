import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { DepositDto, TransferDto, ReverseDto } from './wallet.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Wallet')
@ApiBearerAuth()
@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('deposit')
  @ApiOperation({
    summary: 'Depositar dinheiro na carteira',
    description:
      'O campo reversedAt será null em depósitos normais. Se o depósito for revertido, reversedAt terá a data/hora da reversão.',
  })
  @ApiResponse({
    status: 201,
    description:
      'Depósito realizado com sucesso. O campo reversedAt será null em depósitos normais. Se o depósito for revertido, reversedAt terá a data/hora da reversão.',
    schema: {
      example: {
        id: 'uuid',
        type: 'DEPOSIT',
        amount: 100,
        toUserId: 'uuid',
        status: 'COMPLETED',
        createdAt: '2024-07-17T18:00:00.000Z',
        reversedAt: null,
        reversalReferenceId: null,
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Depósito bloqueado: saldo negativo.',
  })
  async deposit(@Request() req, @Body() dto: DepositDto) {
    return this.walletService.deposit(req.user.id, dto);
  }

  @Post('transfer')
  @ApiOperation({
    summary: 'Transferir dinheiro para outro usuário',
    description:
      'O campo reversedAt será null em transferências normais. Se a transferência for revertida, reversedAt terá a data/hora da reversão.',
  })
  @ApiResponse({
    status: 201,
    description:
      'Transferência realizada com sucesso. O campo reversedAt será null em transferências normais. Se a transferência for revertida, reversedAt terá a data/hora da reversão.',
    schema: {
      example: {
        id: 'uuid',
        type: 'TRANSFER',
        amount: 50,
        fromUserId: 'uuid',
        toUserId: 'uuid',
        status: 'COMPLETED',
        createdAt: '2024-07-17T18:05:00.000Z',
        reversedAt: null,
        reversalReferenceId: null,
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Saldo insuficiente ou saldo negativo.',
  })
  async transfer(@Request() req, @Body() dto: TransferDto) {
    return this.walletService.transfer(req.user.id, dto);
  }

  @Post('reverse')
  @ApiOperation({
    summary: 'Reverter uma transação (depósito ou transferência)',
    description:
      'O campo reversedAt indica a data/hora em que a transação original foi revertida.',
  })
  @ApiResponse({
    status: 201,
    description:
      'Reversão realizada com sucesso. O campo reversedAt indica a data/hora em que a transação original foi revertida.',
    schema: {
      example: {
        id: 'uuid',
        type: 'REVERSAL',
        amount: 50,
        fromUserId: 'uuid',
        toUserId: 'uuid',
        status: 'COMPLETED',
        createdAt: '2024-07-17T18:10:00.000Z',
        reversedAt: null,
        reversalReferenceId: 'uuid',
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Sem permissão para reverter.' })
  async reverse(@Request() req, @Body() dto: ReverseDto) {
    return this.walletService.reverse(req.user.id, dto);
  }
}
