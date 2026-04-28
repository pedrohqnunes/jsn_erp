# JSN CRM - Mini ERP para Pintura Eletrostática

Sistema de gestão integrada de ponta a ponta orientado ao pipeline:

**ORÇAMENTO → APROVAÇÃO → ORDEM DE SERVIÇO → PRODUÇÃO → FINALIZAÇÃO → FINANCEIRO**

## Stack

- **Backend**: NestJS 10 + Prisma 5 + PostgreSQL 16 + JWT
- **Frontend**: Next.js 14 (App Router) + Tailwind + SWR + Recharts
- **Database**: PostgreSQL via Docker

## Estrutura do projeto

```
jsn_crm/
├── docker-compose.yml         # Postgres local
├── backend/                   # API NestJS
│   ├── prisma/
│   │   ├── schema.prisma     # Modelagem relacional
│   │   └── seed.ts           # Dados iniciais
│   └── src/
│       ├── auth/             # JWT, login, register
│       ├── clients/          # CRUD + histórico, ticket médio
│       ├── quotes/           # Orçamentos + PDF + conversão p/ OS
│       ├── service-orders/   # OS - núcleo do pipeline
│       ├── production/       # Etapas de produção (kanban)
│       ├── receivables/      # Contas a receber (auto-geradas)
│       ├── payables/         # Contas a pagar + recorrência
│       ├── employees/        # Equipe operacional
│       ├── dashboard/        # KPIs financeiros/operacionais/estratégicos
│       └── prisma/           # Prisma service global
└── frontend/                  # Next.js 14
    └── src/
        ├── app/(app)/        # Telas autenticadas
        ├── app/login/        # Login
        ├── components/       # AppShell, Modal, PageHeader
        └── lib/              # api client, labels, formatters
```

## Pipeline central

```
┌────────────┐  aprovar+converter  ┌─────────────────┐
│ Orçamento  │ ──────────────────▶ │ Ordem de Serviço│
└────────────┘                     └────────┬────────┘
                                            │
                            ┌───────────────┼────────────────┐
                            ▼               ▼                ▼
                       ┌─────────┐    ┌──────────┐    ┌──────────────┐
                       │Produção │    │Receivables│    │  Margem      │
                       │(etapas) │    │(parcelas) │    │(automática)  │
                       └────┬────┘    └──────────┘    └──────────────┘
                            │
                  todas etapas DONE
                            ▼
                     OS = FINISHED
```

### Automações implementadas

- **Aprovação de orçamento → OS**: cria OS, etapas-padrão de produção e parcelas de recebimento.
- **Parcelamento automático**: divide o total em N parcelas mensais a partir do 1º vencimento.
- **Margem automática**: calculada em todos os níveis (item, orçamento, OS) pelo total venda − custo.
- **Cascata de status produção → OS**: ao iniciar uma etapa a OS vira `IN_PRODUCTION`; quando todas concluem, vira `FINISHED`.
- **Inadimplência diária**: cron 1h da manhã marca recebíveis e despesas vencidas como `OVERDUE`.
- **Despesas recorrentes**: ao baixar uma despesa marcada como recorrente, gera automaticamente a próxima.
- **Cancelamento de OS**: cancela todos os recebíveis pendentes vinculados.

## Setup local

### Pré-requisitos

- Node.js 18+
- Docker (para Postgres) ou Postgres 14+ instalado
- npm

### 1. Subir o banco

```bash
docker compose up -d
```

(Ou aponte `DATABASE_URL` para um Postgres existente.)

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run seed
npm run start:dev
```

API: `http://localhost:3001/api`

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

App: `http://localhost:3000`

### 4. Login

```
admin@jsn.local
admin123
```

## Endpoints principais

| Recurso          | Métodos                                       |
|------------------|------------------------------------------------|
| `/auth`          | `POST /login`, `POST /register`, `GET /me`     |
| `/clients`       | CRUD + `GET /:id/history`                      |
| `/quotes`        | CRUD + `GET /:id/pdf`, `POST /:id/convert`     |
| `/service-orders`| CRUD + `PATCH /:id/status`                     |
| `/production`    | `GET /board`, CRUD `/stages`                   |
| `/receivables`   | listagem, `POST /:id/pay`, `PATCH /:id/cancel` |
| `/payables`      | CRUD + `POST /:id/pay`                         |
| `/employees`     | CRUD                                           |
| `/dashboard`     | `/overview`, `/top-clients`, `/margin-by-os`   |

Todas as rotas exigem JWT no header `Authorization: Bearer <token>` (exceto `/auth/login` e `/auth/register`).

## Dashboards

- **Financeiro**: contas a pagar/receber pendentes e atrasadas, recebido/pago no mês, saldo, fluxo de caixa dos últimos 6 meses, previsão dos próximos 6 meses.
- **Operacional**: ordens por status, tempo médio de produção, OS finalizadas no mês.
- **Comercial**: total de orçamentos, aprovados, taxa de conversão, top 10 clientes mais rentáveis (com ticket médio).
- **Estratégico**: receita, custo, margem total e margem média percentual do mês.

## Próximos passos preparados

A arquitetura já está pronta para receber:

1. **WhatsApp**: o endpoint `GET /quotes/:id/pdf` retorna um buffer PDF; basta plugar uma integração que envie esse buffer (Z-API, Twilio, WAHA, etc.).
2. **Produtividade por funcionário**: o modelo `ProductionStage` já registra `responsibleId`, `startedAt` e `finishedAt`, viabilizando relatórios de tempo por etapa/funcionário.
3. **Marketplaces / ERP externo**: API REST modular separada por domínio, fácil de expor parcialmente para integrações.

## Modelo de dados (resumo)

- `User` - usuários do sistema (login)
- `Client` - clientes (PF/PJ)
- `Quote` ↔ `QuoteItem` - orçamentos com itens
- `ServiceOrder` - OS (1:1 opcional com Quote)
- `ProductionStage` - etapas N:1 com OS
- `Receivable` - parcelas N:1 com OS
- `Payable` - despesas (independente)
- `Employee` - funcionários N:1 nas OS e Stages

Tudo relacional, sem campos calculados em planilha. Margens, totais e parcelamentos são derivados em tempo de criação.

## Comandos úteis

```bash
# Backend
npm run prisma:studio          # Inspecionar banco
npm run prisma:migrate         # Nova migração
npm run seed                   # Repopular dados iniciais

# Frontend
npm run build && npm start     # Build e produção
```
