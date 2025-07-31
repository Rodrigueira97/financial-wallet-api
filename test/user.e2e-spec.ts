import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { User } from 'generated/prisma';

interface UserListResponse {
  users: Array<{ id: string; name: string; email: string; createdAt: string }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();
  });

  beforeEach(async () => {
    // Limpar o banco de dados antes de cada teste
    await prisma.transaction.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.transaction.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  describe('/user (GET)', () => {
    it('should return paginated list of users', async () => {
      // Criar usuários de teste
      const user1 = await prisma.user.create({
        data: {
          name: 'User 1',
          email: 'user1@test.com',
          password: 'hashedpassword',
        },
      });

      const user2 = await prisma.user.create({
        data: {
          name: 'User 2',
          email: 'user2@test.com',
          password: 'hashedpassword',
        },
      });

      const user3 = await prisma.user.create({
        data: {
          name: 'User 3',
          email: 'user3@test.com',
          password: 'hashedpassword',
        },
      });

      // Gerar token JWT para user1
      const token = jwtService.sign({ sub: user1.id, email: user1.email });

      const response = await request(app.getHttpServer())
        .get('/user')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const responseBody = response.body as UserListResponse;

      expect(responseBody).toHaveProperty('users');
      expect(responseBody).toHaveProperty('pagination');
      expect(responseBody.users).toHaveLength(2); // user2 e user3, não user1
      expect(responseBody.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      // Verificar se user1 não está na lista
      const userIds = responseBody.users.map((user) => user.id);
      expect(userIds).not.toContain(user1.id);
      expect(userIds).toContain(user2.id);
      expect(userIds).toContain(user3.id);
    });

    it('should handle pagination parameters', async () => {
      // Criar múltiplos usuários
      const users: User[] = [];
      for (let i = 1; i <= 15; i++) {
        const user = await prisma.user.create({
          data: {
            name: `User ${i}`,
            email: `user${i}@test.com`,
            password: 'hashedpassword',
          },
        });
        users.push(user);
      }

      // Gerar token JWT para o primeiro usuário
      const token = jwtService.sign({
        sub: users[0].id,
        email: users[0].email,
      });

      const response = await request(app.getHttpServer())
        .get('/user?page=2&limit=5')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const responseBody = response.body as UserListResponse;

      expect(responseBody.pagination).toMatchObject({
        page: 2,
        limit: 5,
        total: 14, // 15 usuários - 1 (usuário autenticado)
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      });

      expect(responseBody.users).toHaveLength(5);
    });

    it('should return 401 without valid token', async () => {
      await request(app.getHttpServer()).get('/user').expect(401);
    });

    it('should validate pagination parameters', async () => {
      const user = await prisma.user.create({
        data: {
          name: 'Test User',
          email: 'test@test.com',
          password: 'hashedpassword',
        },
      });

      const token = jwtService.sign({ sub: user.id, email: user.email });

      // Testar página inválida
      await request(app.getHttpServer())
        .get('/user?page=0')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      // Testar limite inválido
      await request(app.getHttpServer())
        .get('/user?limit=0')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      await request(app.getHttpServer())
        .get('/user?limit=101')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });
});
