import { Controller } from '@nestjs/common';
import { UsersRepository } from './repositories/users-repository';

@Controller()
export class AppController {
  constructor(private usersRepository: UsersRepository) {}
}
