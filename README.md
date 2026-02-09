# FLA7A ERP

**Système ERP agricole 100% marocain** - Gestion complète des exploitations agricoles au Maroc.

## Architecture

```
fla7a-erp/
├── apps/
│   ├── api/          # NestJS backend (REST + WebSocket)
│   ├── web/          # Next.js 14 frontend (FR/AR/Darija)
│   └── mobile/       # React Native / Expo
├── packages/
│   ├── database/     # Prisma schema + migrations + seed
│   └── shared/       # Utils, constants, validation
└── docker-compose.yml
```

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Backend | NestJS, Prisma, PostgreSQL/PostGIS, Redis, JWT + RBAC |
| Frontend | Next.js 14 App Router, Tailwind CSS, next-intl (FR/AR/Darija) |
| Mobile | React Native, Expo Router, Zustand, i18next |
| Storage | MinIO (S3-compatible) |
| Search | Meilisearch |
| IA | 8 agents spécialisés (Claude API) |
| CI/CD | GitHub Actions, Docker, EAS Build |

## Modules

- **Fermes** - Gestion multi-fermes avec parcelles géolocalisées
- **Cultures** - Cycles culturaux, activités, récoltes
- **Stock** - Produits, mouvements (entrée/sortie/ajustement), alertes seuil
- **Finance** - Factures, paiements, TVA marocaine, comptabilité
- **RH** - Employés, paie (CNSS/AMO/IR), pointage, contrats ANAPEC
- **Ventes** - Clients, commandes, bon de livraison
- **Conformité** - Certifications (ONSSA, GlobalGAP, Bio Maroc), alertes expiration
- **Agents IA** - Agro-conseil, finance, stock, météo, phytosanitaire, marché, qualité, RH
- **Dashboard** - KPIs temps réel, météo, alertes
- **Notifications** - WebSocket temps réel + push mobile

## Démarrage rapide

### Prérequis

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose

### Installation

```bash
# Cloner le repo
git clone https://github.com/your-org/fla7a-erp.git
cd fla7a-erp

# Installer les dépendances
pnpm install

# Démarrer les services Docker
docker-compose up -d

# Générer le client Prisma
cd packages/database && pnpm prisma generate && cd ../..

# Appliquer les migrations
cd packages/database && pnpm prisma db push && cd ../..

# Seed la base de données
cd packages/database && pnpm prisma db seed && cd ../..

# Lancer en développement
pnpm dev
```

### Identifiants de démo

| Rôle | Téléphone | Mot de passe |
|------|-----------|--------------|
| Admin | +212661000001 | Fla7a@2025 |
| Comptable | +212661000002 | Fla7a@2025 |
| Chef de ferme | +212661000003 | Fla7a@2025 |
| Commercial | +212661000004 | Fla7a@2025 |

### URLs

- Frontend: http://localhost:3000
- API: http://localhost:4000
- MinIO Console: http://localhost:9001
- Meilisearch: http://localhost:7700

## Scripts

```bash
pnpm dev              # Lancer tous les services en dev
pnpm build            # Build production
pnpm lint             # Linter
pnpm test             # Tests unitaires (64 tests)
pnpm type-check       # Vérification TypeScript
```

## Spécificités marocaines

### Paie
- **SMAG**: 84.37 MAD/jour
- **CNSS**: Salarié 4.48%, Employeur 8.98% (plafond 6000 MAD)
- **AMO**: Salarié 2.26%, Employeur 4.11%
- **IR**: Barème progressif marocain

### Fiscalité
- **TVA**: 0%, 7%, 10%, 14%, 20%
- **IS**: Exonéré si CA < 5M MAD (secteur agricole)

### Conformité
- Certifications ONSSA obligatoires
- Traçabilité phytosanitaire
- Support GlobalGAP et Bio Maroc

### Régions agricoles
- Souss-Massa (agrumes, maraîchage)
- Fès-Meknès (oliviers, céréales)
- Rabat-Salé-Kénitra (maraîchage, riz)
- Marrakech-Safi (oliviers, arganier)
- Drâa-Tafilalet (dattes, safran)
- Oriental (agrumes, élevage)

## Agents IA

| Agent | Fonction |
|-------|----------|
| Agro-conseil | Recommandations culturales, calendrier, rotation |
| Finance | Analyse rentabilité, prévisions, optimisation fiscale |
| Stock | Alertes rupture, optimisation achats, DLC |
| Météo | Prévisions, alertes gel/canicule, irrigation |
| Phytosanitaire | Diagnostic maladies, traitements, dosages |
| Marché | Prix souk, tendances, meilleur moment de vente |
| Qualité | Contrôle qualité, normes export, calibrage |
| RH | Planification main d'oeuvre, conformité CNSS |

## Tests

```bash
# Tests unitaires backend (43 tests)
cd apps/api && pnpm test

# Tests shared utils (21 tests)
cd packages/shared && pnpm test

# Tests E2E (nécessite Docker)
cd apps/api && pnpm test:e2e
```

## Licence

Propriétaire - Tous droits réservés.
