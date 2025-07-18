import { IsNumber, IsPositive, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DepositDto {
  @ApiProperty({
    example: 100,
    description: 'Valor a ser depositado (positivo)',
  })
  @IsNumber()
  @IsPositive()
  amount: number;
}

export class TransferDto {
  @ApiProperty({
    example: 'uuid-do-usuario',
    description: 'ID do usuário destinatário',
  })
  @IsUUID()
  toUserId: string;

  @ApiProperty({
    example: 50,
    description: 'Valor a ser transferido (positivo)',
  })
  @IsNumber()
  @IsPositive()
  amount: number;
}

export class ReverseDto {
  @ApiProperty({
    example: 'uuid-da-transacao',
    description: 'ID da transação a ser revertida',
  })
  @IsUUID()
  transactionId: string;
}
