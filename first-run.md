# Bigcapital - Guide d'installation et de premier lancement

Ce guide décrit toutes les étapes nécessaires pour installer et lancer Bigcapital pour la première fois, ainsi que les erreurs rencontrées et leurs solutions.

## Prérequis

- Node.js 16.x, 17.x ou 18.x
- pnpm (gestionnaire de paquets)
- Docker (pour MariaDB, MongoDB, Redis)
- Git

## Architecture du projet

Bigcapital utilise une architecture monorepo avec Lerna :

```
bigcapital/
├── packages/
│   ├── server/          # Backend NestJS
│   ├── webapp/          # Frontend React
│   ├── utils/           # Utilitaires partagés
│   ├── pdf-templates/   # Templates PDF
│   └── email-components/# Composants d'email
└── package.json         # Configuration racine
```

Le serveur utilise :
- **NestJS** pour le framework backend
- **Knex.js** pour les migrations de base de données
- **Objection.js** comme ORM
- **MySQL/MariaDB** comme base de données système et tenants
- **MongoDB** pour certaines données
- **Redis** pour le cache et les queues

## Étape 1 : Installation des dépendances

```bash
cd H:\Github\opensource\bigcapital
pnpm install
```

**Note** : Des avertissements de peer dependencies peuvent apparaître, mais ils n'empêchent pas le fonctionnement du projet.

## Étape 2 : Configuration de l'environnement

Créer un fichier `.env` à la racine du projet avec les variables suivantes :

```env
# Base de données
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_CHARSET=utf8
SYSTEM_DB_NAME=bigcapital_system

# MongoDB
MONGODB_URI=mongodb://localhost:27017/bigcapital

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Application
NODE_ENV=development
PORT=3000

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRATION=7d

# Storage (AWS S3 ou local)
STORAGE_DRIVER=local
```

## Étape 3 : Lancement des services Docker

Bigcapital nécessite plusieurs services qui tournent via Docker :

```bash
docker-compose up -d
```

Cela démarre :
- MariaDB (base de données principale)
- MongoDB
- Redis

**Vérifier que les conteneurs sont actifs** :
```bash
docker ps
```

## Étape 4 : Système de migrations de base de données

### 4.1 Configuration de Knex

Le fichier `packages/server/knexfile.js` configure Knex pour les migrations :

```javascript
module.exports = {
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.SYSTEM_DB_NAME || 'bigcapital_system',
      charset: process.env.DB_CHARSET || 'utf8',
    },
    migrations: {
      directory: './src/database/migrations',
      extension: 'ts',
      loadExtensions: ['.ts'],
    },
    // ...
  }
};
```

### 4.2 CLI pour les migrations

Un système CLI a été créé dans `packages/server/src/cli/cli.ts` utilisant Commander.js pour gérer les migrations de la base de données système.

**Commandes disponibles** :

```bash
# Depuis la racine du projet
pnpm run cli system:migrate:latest    # Exécute les migrations
pnpm run cli system:migrate:rollback  # Rollback des migrations
pnpm run cli system:migrate:make <name> # Crée une nouvelle migration

# Ou depuis packages/server
cd packages/server
pnpm run cli system:migrate:latest
```

**Alternative via Knex directement** :

```bash
# Depuis packages/server
pnpm run migrate:latest   # Exécute les migrations
pnpm run migrate:rollback # Rollback des migrations
pnpm run migrate:make     # Crée une nouvelle migration
```

### 4.3 Exécution des migrations système

```bash
cd packages/server
pnpm run migrate:latest
```

ou depuis la racine :

```bash
pnpm run migrate:latest
```

**Résultat attendu** :
```
Batch 1 run: X migrations
migration_file_1.ts
migration_file_2.ts
...
```

Si déjà à jour :
```
Already up to date
```

## Étape 5 : Build du projet

### 5.1 Build du serveur

```bash
# Depuis la racine
pnpm run build:server

# Ou
cd packages/server
pnpm run build
```

Le build NestJS crée un dossier `dist/` avec le code compilé.

### 5.2 Build de la webapp (optionnel pour développement)

```bash
pnpm run build:webapp
```

## Étape 6 : Lancement en développement

### Serveur uniquement

```bash
pnpm run dev:server
```

Le serveur démarre sur `http://localhost:3000`

### Webapp uniquement

```bash
pnpm run dev:webapp
```

### Tous les services

```bash
pnpm run dev
```

## Scripts disponibles

### Racine du projet (`package.json`)

```json
{
  "dev": "lerna run dev",
  "build": "lerna run build",
  "dev:webapp": "lerna run dev --scope \"@bigcapital/webapp\" ...",
  "build:webapp": "lerna run build --scope \"@bigcapital/webapp\" ...",
  "dev:server": "lerna run dev --scope \"@bigcapital/server\" ...",
  "build:server": "lerna run build --scope \"@bigcapital/server\" ...",
  "serve:server": "lerna run serve --scope \"@bigcapital/server\" ...",
  "cli": "cd packages/server && pnpm run cli",
  "migrate:latest": "cd packages/server && pnpm run migrate:latest",
  "migrate:rollback": "cd packages/server && pnpm run migrate:rollback",
  "migrate:make": "cd packages/server && pnpm run migrate:make"
}
```

### Server (`packages/server/package.json`)

```json
{
  "build": "nest build",
  "dev": "nest start --watch",
  "serve": "node dist/main",
  "start": "nest start",
  "start:prod": "node dist/main",
  "migrate:latest": "knex migrate:latest --knexfile knexfile.js",
  "migrate:rollback": "knex migrate:rollback --knexfile knexfile.js",
  "migrate:make": "knex migrate:make --knexfile knexfile.js",
  "seed:run": "knex seed:run --knexfile knexfile.js",
  "cli": "ts-node --transpile-only -r tsconfig-paths/register src/cli/cli.ts"
}
```

## Erreurs rencontrées et solutions

### Erreur 1 : Module dotenv manquant lors du build CLI

**Erreur** :
```
error TS2307: Cannot find module 'dotenv' or its corresponding type declarations.
```

**Cause** : dotenv n'était installé que comme devDependency.

**Solution** : Installer dotenv comme dependency :
```bash
cd packages/server
pnpm add dotenv
```

### Erreur 2 : Migrations directory not found

**Erreur** :
```
ENOENT: no such file or directory, scandir 'packages/server/database/migrations'
```

**Cause** : Les migrations sont dans `src/database/migrations` et non `database/migrations`.

**Solution** : Configuration correcte dans `knexfile.js` et `cli.ts` :
```javascript
migrations: {
  directory: './src/database/migrations',
  extension: 'ts',
  loadExtensions: ['.ts'],
}
```

### Erreur 3 : Peer dependencies warnings

**Avertissement** :
```
WARN Issues with peer dependencies found
```

**Cause** : Certains packages ont des versions de peer dependencies qui ne correspondent pas exactement.

**Solution** : Ces avertissements peuvent être ignorés pour le moment. Le projet fonctionne malgré ces warnings.

### Erreur 4 : Cannot find module bcrypt_lib.node

**Erreur** :
```
Error: Cannot find module 'H:\Github\opensource\bigcapital\node_modules\.pnpm\bcrypt@5.1.1_encoding@0.1.13\node_modules\bcrypt\lib\binding\napi-v3\bcrypt_lib.node'
```

**Cause** : Le module natif bcrypt n'était pas compilé correctement pour la version de Node.js utilisée.

**Solution** : Réinstaller bcrypt :
```bash
cd packages/server
pnpm remove bcrypt && pnpm add bcrypt
```

Cela installe automatiquement la version compatible (bcrypt@6.0.0) et compile le module natif.

### Erreur 5 : Redis version trop ancienne

**Erreur** :
```
Error: Redis version needs to be greater or equal than 5.0.0 Current: 3.0.504
```

**Cause** : BullMQ (utilisé pour les queues) nécessite Redis version >= 5.0.0, mais le serveur utilise une version 3.x.

**Solution** : Mettre à jour Redis dans votre configuration Docker.

Si vous utilisez `docker-compose.yml`, mettez à jour l'image Redis :

```yaml
services:
  redis:
    image: redis:7-alpine  # ou redis:6-alpine, redis:5-alpine
    ports:
      - "6379:6379"
```

Puis redémarrez les conteneurs :

```bash
docker-compose down
docker-compose up -d
```

**Alternative** : Si vous installez Redis directement (sans Docker) :

Windows (avec Chocolatey) :
```bash
choco upgrade redis-64
```

Linux :
```bash
sudo apt-get update
sudo apt-get install redis-server
```

MacOS :
```bash
brew upgrade redis
```

Vérifier la version de Redis :
```bash
redis-cli --version
```

## Architecture du CLI

Le CLI (`packages/server/src/cli/cli.ts`) est un outil en ligne de commande autonome qui :

1. Charge les variables d'environnement via dotenv
2. Initialise une connexion Knex directement (sans passer par NestJS)
3. Utilise Commander.js pour gérer les commandes
4. Exécute les migrations via l'API Knex

**Avantages** :
- Pas de dépendance à NestJS pour les migrations
- Plus rapide à démarrer
- Moins de risques d'erreurs liées aux modules natifs

## Vérification de l'installation

### 1. Vérifier que les services Docker tournent

```bash
docker ps
```

Vous devriez voir MariaDB, MongoDB et Redis.

### 2. Vérifier la connexion à la base de données

```bash
cd packages/server
pnpm run cli system:migrate:latest
```

Si la connexion est OK et les migrations déjà exécutées : "Already up to date"

### 3. Lancer le serveur en développement

```bash
pnpm run dev:server
```

Le serveur devrait démarrer sur le port 3000 (ou celui configuré).

### 4. Tester une requête API

```bash
curl http://localhost:3000/api/health
```

## Prochaines étapes

1. **Créer un utilisateur admin** : Utiliser les seeders ou le CLI
2. **Créer une première organisation** : Via l'API ou l'interface
3. **Développer de nouvelles fonctionnalités** : Suivre `fonctionnalites.md`

## Ressources

- Documentation NestJS : https://nestjs.com
- Documentation Knex : https://knexjs.org
- Documentation Objection : https://vincit.github.io/objection.js/

## Notes importantes

1. **Multi-tenancy** : Bigcapital utilise une base de données système (`bigcapital_system`) pour gérer les organizations/tenants, et crée une base de données par tenant pour isoler les données.

2. **Migrations système vs tenant** :
   - Les migrations système s'exécutent via `pnpm run migrate:latest`
   - Les migrations tenant doivent être exécutées pour chaque organisation créée

3. **Développement** : Utilisez toujours `pnpm run dev:server` pour le développement, pas `pnpm run serve` (qui exécute le build).

4. **Variables d'environnement** : Le fichier `.env` est chargé depuis :
   - La racine du projet : `H:\Github\opensource\bigcapital/.env`
   - Le package server : `H:\Github\opensource\bigcapital/packages/server/.env`

## Commandes de dépannage

### Réinstaller les dépendances
```bash
rm -rf node_modules packages/*/node_modules
pnpm install
```

### Reconstruire les modules natifs
```bash
cd packages/server
pnpm rebuild bcrypt
```

### Nettoyer les builds
```bash
rm -rf packages/server/dist
rm -rf packages/webapp/build
```

### Reset de la base de données
```bash
cd packages/server
pnpm run migrate:rollback --all
pnpm run migrate:latest
```
