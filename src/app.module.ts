import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaService } from './database/prisma.service';
import { UsersRepository } from './repositories/user/users-repository';
import { PrismaUserRepository } from './repositories/user/prisma/prisma-user-repository';
import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './auth/jwt.strategy';
import { WalletService } from './wallet/wallet.service';
import { WalletController } from './wallet/wallet.controller';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default_secret',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [
    AppController,
    AuthController,
    WalletController,
    UserController,
  ],
  providers: [
    PrismaService,
    {
      provide: UsersRepository,
      useClass: PrismaUserRepository,
    },
    AuthService,
    JwtStrategy,
    WalletService,
    UserService,
  ],
})
export class AppModule {}
