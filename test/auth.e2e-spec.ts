import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const user = {
    name: 'Test User',
    email: 'testuser@example.com',
    password: 'testpass123',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    await prisma.user.deleteMany({ where: { email: user.email } });
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/register (POST) - deve registrar novo usuário', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send(user)
      .expect(201);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('/auth/register (POST) - deve falhar ao registrar email já existente', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(user)
      .expect(409);
  });

  it('/auth/login (POST) - deve autenticar usuário com credenciais corretas', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: user.password })
      .expect(201);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('/auth/login (POST) - deve falhar com senha incorreta', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: 'wrongpass' })
      .expect(401);
  });

  it('/auth/login (POST) - deve falhar com email inexistente', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'notfound@example.com', password: 'any' })
      .expect(401);
  });
});
