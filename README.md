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

---

## Principais Diferenciais

- **Configuração Docker:** Ambiente local consistente com Docker e Docker Compose.
- **Testes de Integração e Unidade:** Cobertura completa de testes e2e e unitários.
- **Documentação de API:** Swagger disponível em `/api`, com exemplos e validações detalhadas.
- **Observabilidade:** Logger do NestJS, tratamento centralizado de erros e mensagens padronizadas.
- **Arquitetura Limpa e SOLID:** Separação clara de camadas, uso de DTOs, injeção de dependências, tipagem forte.
- **Segurança:** Autenticação JWT, hash de senha com bcrypt, validações de saldo e permissões.

---

## Tecnologias Utilizadas

- Node.js
- NestJS
- PostgreSQL
- Prisma ORM
- Docker
- Jest
- Supertest
- Swagger

---

## Como rodar o projeto

- Crie o arquivo .env com as seguintes variáveis:

```sh
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/wallet?sslmode=require&channel_binding=require" 
JWT_SECRET="test"
PORT="3000"
```

- Rode o projeto com o seguinte comando:

```sh
docker-compose up
```
Acesse a documentação Swagger em: [http://localhost:3000/api](http://localhost:3000/api)

### Testes

- Para rodar os testes de unidade e integração:
  ```sh
  npm run test       # Testes unitários
  npm run test:e2e   # Testes de integração (e2e)
  ```
- As variáveis de ambiente necessárias estão no arquivo `.env.example`.
- A documentação completa dos endpoints está disponível via Swagger após subir o projeto.

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