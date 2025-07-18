import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'john doe', description: 'Nome do usuário' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiProperty({
    example: 'johndoe@email.com',
    description: 'Email do usuário',
  })
  @IsEmail({}, { message: 'Invalid email' })
  email: string;

  @ApiProperty({
    example: 'senhaSegura123',
    description: 'Senha do usuário (mínimo 6 caracteres)',
  })
  @IsString()
  @MinLength(6)
  @MaxLength(32)
  password: string;
}

export class LoginDto {
  @ApiProperty({
    example: 'johndoe@email.com',
    description: 'Email do usuário',
  })
  @IsEmail({}, { message: 'Invalid email' })
  email: string;

  @ApiProperty({ example: 'senhaSegura123', description: 'Senha do usuário' })
  @IsString()
  @MinLength(6)
  @MaxLength(32)
  password: string;
}
