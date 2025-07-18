import { User } from '../../generated/prisma';

export abstract class UsersRepository {
  abstract create(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<void>;

  abstract findByEmail(email: string): Promise<User | null>;
}
