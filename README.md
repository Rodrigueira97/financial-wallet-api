<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->


# Financial Wallet API

## Resumo do Projeto

Esta API RESTful foi desenvolvida para gerenciar uma carteira financeira digital, permitindo que usuários realizem depósitos, transferências, recebam valores e revertam transações, com foco em segurança, escalabilidade e boas práticas de engenharia de software.

### Principais Diferenciais

- **Configuração Docker**: Ambiente local consistente com Docker e Docker Compose, incluindo banco de dados PostgreSQL e aplicação NestJS.
- **Testes de Integração e Unidade**: Cobertura completa de testes e2e (autenticação, operações de carteira, reversões) e unitários (lógica de negócio isolada), garantindo robustez e confiabilidade.
- **Documentação de API**: Documentação interativa via Swagger disponível em `/api`, com exemplos, descrições e validações detalhadas para todos os endpoints e DTOs.
- **Observabilidade**: Uso extensivo do Logger do NestJS para rastreamento de operações, tratamento centralizado de erros e mensagens padronizadas.
- **Arquitetura Limpa e SOLID**: Separação clara de camadas (controller, service, repository), uso de DTOs, injeção de dependências, tipagem forte (TypeScript/Prisma) e princípios SOLID aplicados.
- **Segurança**: Autenticação JWT (access/refresh token), hash de senha com bcrypt, validações de saldo e permissões, tratamento de exceções HTTP.

---

## Como rodar o projeto

### Com Docker (recomendado)
```sh
docker-compose up --build
```
Acesse a documentação Swagger em: [http://localhost:3000/api](http://localhost:3000/api)

### Localmente (Node.js)
```sh
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

---

## Tabela de Endpoints

| Método | Rota                | Descrição                       | Autenticação |
|--------|---------------------|---------------------------------|--------------|
| POST   | /auth/register      | Registro de usuário             | Não          |
| POST   | /auth/login         | Login e obtenção de tokens      | Não          |
| POST   | /wallet/deposit     | Depósito na carteira            | Sim          |
| POST   | /wallet/transfer    | Transferência para outro usuário| Sim          |
| POST   | /wallet/reverse     | Reversão de transação           | Sim          |

---

## Exemplos de Requisições

### Registro de Usuário
```http
POST /auth/register
Content-Type: application/json

{
  "name": "João da Silva",
  "email": "joao@email.com",
  "password": "senhaSegura123"
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "joao@email.com",
  "password": "senhaSegura123"
}
```

### Depósito
```http
POST /wallet/deposit
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "amount": 100
}
```

### Transferência
```http
POST /wallet/transfer
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "toUserId": "uuid-do-destinatario",
  "amount": 50
}
```

### Reversão de Transação
```http
POST /wallet/reverse
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "transactionId": "uuid-da-transacao"
}
```

---
