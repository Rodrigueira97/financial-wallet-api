import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('WalletController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;
  let otherUserId: string;
  let otherAccessToken: string;

  const user = {
    name: 'Wallet User',
    email: 'walletuser@example.com',
    password: 'testpass123',
  };
  const otherUser = {
    name: 'Other User',
    email: 'otheruser@example.com',
    password: 'testpass123',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    await prisma.transaction.deleteMany({});

    await prisma.user.deleteMany({
      where: { email: { in: [user.email, otherUser.email] } },
    });

    await request(app.getHttpServer()).post('/auth/register').send(user);

    await request(app.getHttpServer()).post('/auth/register').send(otherUser);

    const res1 = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: user.password });
    accessToken = res1.body.accessToken;
    userId = (await prisma.user.findUnique({ where: { email: user.email } }))!
      .id;

    const res2 = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: otherUser.email, password: otherUser.password });
    otherAccessToken = res2.body.accessToken;
    otherUserId = (await prisma.user.findUnique({
      where: { email: otherUser.email },
    }))!.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/wallet/deposit (POST) - deve permitir depósito válido', async () => {
    const res = await request(app.getHttpServer())
      .post('/wallet/deposit')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ amount: 100 })
      .expect(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.type).toBe('DEPOSIT');
  });

  it('/wallet/deposit (POST) - deve bloquear depósito se saldo negativo', async () => {
    await prisma.user.update({ where: { id: userId }, data: { balance: -10 } });

    await request(app.getHttpServer())
      .post('/wallet/deposit')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ amount: 50 })
      .expect(403);

    await prisma.user.update({ where: { id: userId }, data: { balance: 0 } });
  });

  it('/wallet/transfer (POST) - deve permitir transferência válida', async () => {
    await request(app.getHttpServer())
      .post('/wallet/deposit')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ amount: 200 });

    const res = await request(app.getHttpServer())
      .post('/wallet/transfer')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ toUserId: otherUserId, amount: 50 })
      .expect(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.type).toBe('TRANSFER');
  });

  it('/wallet/transfer (POST) - deve bloquear transferência se saldo insuficiente', async () => {
    await prisma.user.update({ where: { id: userId }, data: { balance: 10 } });
    await request(app.getHttpServer())
      .post('/wallet/transfer')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ toUserId: otherUserId, amount: 100 })
      .expect(403);
  });

  it('/wallet/transfer (POST) - deve bloquear transferência se saldo negativo', async () => {
    await prisma.user.update({ where: { id: userId }, data: { balance: -5 } });
    await request(app.getHttpServer())
      .post('/wallet/transfer')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ toUserId: otherUserId, amount: 1 })
      .expect(403);
    await prisma.user.update({ where: { id: userId }, data: { balance: 0 } });
  });

  it('/wallet/reverse (POST) - deve reverter depósito', async () => {
    const dep = await request(app.getHttpServer())
      .post('/wallet/deposit')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ amount: 30 });

    const res = await request(app.getHttpServer())
      .post('/wallet/reverse')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ transactionId: dep.body.id })
      .expect(201);
    expect(res.body.type).toBe('REVERSAL');
  });

  it('/wallet/reverse (POST) - deve reverter transferência', async () => {
    await request(app.getHttpServer())
      .post('/wallet/deposit')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ amount: 100 });

    const transfer = await request(app.getHttpServer())
      .post('/wallet/transfer')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ toUserId: otherUserId, amount: 20 });

    const res = await request(app.getHttpServer())
      .post('/wallet/reverse')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ transactionId: transfer.body.id })
      .expect(201);
    expect(res.body.type).toBe('REVERSAL');
  });

  it('/wallet/reverse (POST) - deve bloquear reversão se usuário não for parte', async () => {
    const dep = await request(app.getHttpServer())
      .post('/wallet/deposit')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ amount: 10 });

    await request(app.getHttpServer())
      .post('/wallet/reverse')
      .set('Authorization', `Bearer ${otherAccessToken}`)
      .send({ transactionId: dep.body.id })
      .expect(403);
  });
});
