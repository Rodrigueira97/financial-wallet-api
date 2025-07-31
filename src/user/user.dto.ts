import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetAllUsersDto {
  @ApiProperty({
    description: 'Número da página',
    example: 1,
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Quantidade de itens por página',
    example: 10,
    required: false,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class UserResponseDto {
  @ApiProperty({
    description: 'ID do usuário',
    example: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do usuário',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'john.doe@email.com',
  })
  email: string;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-07-17T18:00:00.000Z',
  })
  createdAt: Date;
}

export class PaginationDto {
  @ApiProperty({
    description: 'Página atual',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Itens por página',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Total de itens',
    example: 50,
  })
  total: number;

  @ApiProperty({
    description: 'Total de páginas',
    example: 5,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Tem próxima página',
    example: true,
  })
  hasNextPage: boolean;

  @ApiProperty({
    description: 'Tem página anterior',
    example: false,
  })
  hasPreviousPage: boolean;
}

export class GetAllUsersResponseDto {
  @ApiProperty({
    description: 'Lista de usuários',
    type: [UserResponseDto],
  })
  users: UserResponseDto[];

  @ApiProperty({
    description: 'Informações de paginação',
    type: PaginationDto,
  })
  pagination: PaginationDto;
}
