# FLA7A ERP - Claude Code Guide

## Project Overview
FLA7A is a 100% Moroccan agricultural ERP system. Monorepo using Turborepo + pnpm.

## Architecture
```
apps/
  api/          # NestJS backend (port 4000) - REST API + WebSocket
  web/          # Next.js 14 frontend (port 3000) - App Router + i18n
packages/
  database/     # Prisma ORM schema + seed data
  shared/       # Morocco utils, constants, validation
  ui/           # Shared UI components (placeholder)
  config/       # Shared configs (placeholder)
docker/         # Docker Compose + Nginx
```

## Key Commands
```bash
pnpm install                          # Install all dependencies
pnpm dev                              # Start all apps in dev mode
pnpm --filter @fla7a/api dev          # Start backend only
pnpm --filter @fla7a/web dev          # Start frontend only
cd packages/database && pnpm prisma generate   # Generate Prisma client
cd packages/database && pnpm prisma migrate dev # Run migrations
cd packages/database && pnpm prisma db seed     # Seed database
```

## Backend (apps/api)
- NestJS with 13 modules: Auth, Tenant, Farm, Parcel, Culture, Stock, Finance, HR, Sales, Compliance, Dashboard, Notification, AI Agents
- Multi-tenant via `x-tenant-id` header
- RBAC with 7 roles: SUPER_ADMIN, ADMIN, COMPTABLE, CHEF_EQUIPE, OUVRIER, COMMERCIAL, AUDITEUR
- API prefix: `/api/v1`
- Swagger docs: `/api/docs`

## Frontend (apps/web)
- Next.js 14 App Router with next-intl
- 3 locales: `fr` (French), `ar` (Arabic + RTL), `dar` (Darija)
- Tailwind CSS with FLA7A green theme (primary: #1B7340)
- Route groups: `(auth)` for login/register, `(dashboard)` for main app

## Database
- PostgreSQL + PostGIS
- Prisma ORM with 30+ models, Moroccan enums
- Key models: Tenant, User, Farm, Parcel, CultureCycle, Product, Invoice, Employee, Payslip

## Moroccan Specifics
- SMAG (minimum wage): 84.37 MAD/day
- CNSS: employee 4.48%, employer 8.98%, ceiling 6000 MAD
- TVA rates: 0%, 7%, 10%, 14%, 20%
- CIN format: 1-2 uppercase letters + 5-6 digits
- ICE: exactly 15 digits
- Phone: +212[5-7]XXXXXXXX

## Seed Data
- Demo tenant with 4 users, 3 farms
- Login: +212661000001 / Fla7a@2025
- Farms: Souss-Massa (agrumes), Fes-Meknes (oliviers), Kenitra (maraichage)
