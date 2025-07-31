import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    this.logger.log(`Buscando dados do usuário: ${userId}`);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('Usuário não encontrado');
    }

    const { id, name, email, balance, status, createdAt } = user;

    return { id, name, email, balance: Number(balance), status, createdAt };
  }

  async getAllUsers(userId: string, page: number = 1, limit: number = 10) {
    this.logger.log(`Buscando usuários - página: ${page}, limite: ${limit}`);

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        where: {
          NOT: { id: userId },
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.user.count({
        where: {
          NOT: { id: userId },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      users: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }
}
