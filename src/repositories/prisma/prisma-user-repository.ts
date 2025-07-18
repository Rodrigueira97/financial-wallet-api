import { PrismaService } from '../../database/prisma.service';
import { UsersRepository } from '../users-repository';
import { Injectable } from '@nestjs/common';
import { User } from '../../../generated/prisma';

@Injectable()
export class PrismaUserRepository implements UsersRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<void> {
    await this.prisma.user.create({ data });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }
}
