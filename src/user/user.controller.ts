import { Controller, Get, Request, UseGuards, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { User } from 'generated/prisma';
import { GetAllUsersDto, GetAllUsersResponseDto } from './user.dto';

interface AuthRequest {
  user: User;
}

@ApiTags('User')
@ApiBearerAuth()
@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @ApiOperation({
    summary: 'Detalhes do perfil',
    description: 'Retorna os detalhes do usuário autenticado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil do usuário retornado com sucesso.',
    schema: {
      example: {
        id: 'uuid',
        name: 'John Doe',
        email: 'john.doe@email.com',
        balance: 100.5,
        status: 'active',
        createdAt: '2024-07-17T18:00:00.000Z',
      },
    },
  })
  async profile(@Request() req: AuthRequest) {
    const userId = req.user.id;
    return this.userService.getProfile(userId);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todos os usuários',
    description:
      'Retorna uma lista paginada de todos os usuários da plataforma (exceto o usuário autenticado).',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários retornada com sucesso.',
    type: GetAllUsersResponseDto,
  })
  async getAllUsers(
    @Query() query: GetAllUsersDto,
    @Request() req: AuthRequest,
  ) {
    const userId = req.user.id;

    return this.userService.getAllUsers(userId, query.page, query.limit);
  }
}
