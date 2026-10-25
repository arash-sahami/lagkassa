# Lagkassan

Digital lagkassa (team treasury) for the football team **Fässbergs IF P2012**. Tracks the team's money, each player's personal balance, and sales (e.g. fundraising), with a login so only team admins can see and edit the data.

The UI is in Swedish.

## Features

- **Dashboard** – overview of the team balance and the combined player balances.
- **Spelare (Players)** – add/edit players, view a player's details, balance, transactions and sales. When a player leaves, their remaining balance is transferred to the team (`player_exit` transaction).
- **Lagkassa (Team treasury)** – team income and expenses, by category (försäljning, cuper, utrustning, resor, träning, övrigt).
- **Försäljning (Sales)** – register a sale with quantity, price and cost. Profit is split automatically: if the sale is credited to a player, 50 % goes to the player and 50 % to the team; otherwise 100 % goes to the team.
- **Transaktioner (Transactions)** – full ledger of all transactions.
- **Login** – e-mail/password authentication with password reset. All routes except `/login` and `/registrera` are protected by an auth guard.
- **Invite administrators via QR code** – *Bjud in administratör* in the sidebar creates a one-time invitation (valid 7 days) and shows a QR code / link to `/registrera?token=…`, where the invitee creates an account and chooses a password. No e-mail sending or backend functions needed.
- **Backup** – *Exportera backup* / *Importera backup* buttons in the sidebar download/restore all data as a JSON file. Import validates the file and asks for confirmation before replacing the current data (which is then saved to Firestore).

## Tech stack

- [Angular](https://angular.dev) 21 (standalone components, signals, lazy-loaded routes)
- [Angular Material / CDK](https://material.angular.io) 21
- TypeScript 5.9, RxJS 7.8, zone.js
- Node.js 22 (used in CI)

## External dependencies and services

### Runtime services

| Service | Used for | Where |
|---|---|---|
| **Firebase Authentication** (e-mail/password) | Login, logout, password reset | [auth.service.ts](src/app/core/services/auth.service.ts) |
| **Cloud Firestore** | Persistent storage. All app data is one document: `lagkassa/p2012` | [firestore.service.ts](src/app/core/services/firestore.service.ts) |
| **GitHub Pages** | Hosting of the built app | [.github/workflows/build.yml](.github/workflows/build.yml) |

The Firebase project config is in [firebase.config.ts](src/app/core/firebase.config.ts). Firebase web API keys are not secret; access is enforced by the Firestore security rules in [firestore.rules](firestore.rules).

### Access control

Anyone can technically create a Firebase Auth account, so being logged in is **not** enough – only users listed in `lagkassa_admins` get access.

| Collection | Content | Who can access |
|---|---|---|
| `lagkassa/p2012` | All treasury data | Admins |
| `lagkassa_admins/{uid}` | `{ email, invitation, createdAt }` | Created by the user themselves, only while consuming a valid invitation |
| `lagkassa_invitations/{token}` | `{ createdBy, createdAt, expiresAt, used, usedBy?, usedAt? }` | Created by admins; anyone holding the token can read that single invitation (no listing) |

Registration ([invitation.service.ts](src/app/core/services/invitation.service.ts)) creates the Auth account and then, in one batched write, adds `lagkassa_admins/{uid}` and marks the invitation used. The rules verify both halves of the batch, so an invitation can only be used once and only before it expires.

**Bootstrap the first admin** (one-time, before publishing the rules): in the Firebase console, copy your user's UID from *Authentication → Users* and create the document `lagkassa_admins/<UID>` (fields can be e.g. `email: "<you>"`). Otherwise you lock yourself out.

> The Firebase project also contains `invitations` and `users` collections from another app. This app does not use them. Publishing [firestore.rules](firestore.rules) **replaces all rules in the project** and denies everything not listed – if that other app is still in use, merge its rules first.

### npm packages

Runtime: `@angular/{animations,cdk,common,compiler,core,forms,material,platform-browser,platform-browser-dynamic,router}`, `firebase`, `qrcode` (invitation QR codes, generated locally), `rxjs`, `tslib`, `zone.js`.
Dev: `@angular/cli`, `@angular/compiler-cli`, `@angular-devkit/build-angular`, `@types/qrcode`, `typescript`.

See [package.json](package.json) for exact versions.

### Legacy / optional: Azure infrastructure

The [infra/](infra) folder contains a Bicep template and deploy script from an earlier approach (Cosmos DB serverless + Azure Static Web Apps, free tier). The app currently uses Firebase and does **not** need these. If used:

- Azure CLI (`az`) and a subscription
- `.\infra\deploy.ps1` creates resource group `rg-lagkassa` in `westeurope` and prints the secrets `AZURE_STATIC_WEB_APPS_API_TOKEN` and `COSMOS_CONNECTION_STRING`.

## Getting started

Prerequisites: Node.js 22 and npm.

```bash
npm ci
npm start        # dev server, opens http://localhost:4200
```

Other scripts:

```bash
npm run build    # production build -> dist/lagkassa/browser
npm run watch    # development build in watch mode
```

## Setting up your own Firebase backend

1. Create a Firebase project and add a Web app.
2. Enable **Authentication → Sign-in method → Email/Password** and add your first user.
3. Create a **Firestore** database and add `lagkassa_admins/<your UID>` (see *Access control*).
4. Publish [firestore.rules](firestore.rules) (e.g. `firebase deploy --only firestore:rules`, or paste them in the console). Further admins are invited from the app.
5. Replace the values in [src/app/core/firebase.config.ts](src/app/core/firebase.config.ts) with your project's config.
6. For deployed sites, add the hosting domain (e.g. `<user>.github.io`) under Authentication → Settings → Authorized domains.

## Deployment

The GitHub Actions workflow [build.yml](.github/workflows/build.yml) runs on every push/PR to `main`/`master`:

1. **build** – `npm ci`, `npm run build`, uploads `dist/lagkassa/browser` as an artifact.
2. **deploy** (only on `main`/`master`) – rebuilds with `--base-href "/<repo-name>/"`, copies `index.html` to `404.html` for SPA routing, and publishes to **GitHub Pages**.

Enable it under *Settings → Pages → Source: GitHub Actions*.

## Project structure

```
src/app/
  core/
    firebase.config.ts      Firebase initialisation
    guards/auth.guard.ts    Protects routes
    models/                 Player, Sale, Transaction types and helpers
    services/
      auth.service.ts       Firebase Auth wrapper (signal-based user state)
      firestore.service.ts  Load/save the single app document
      invitation.service.ts Create/consume admin invitations
      storage.service.ts    JSON backup export/import
      treasury.service.ts   Business logic and state (balances, sales split, ...)
  features/                 dashboard, login, register, players, player-detail,
                            team-treasury, sales, transactions
  shared/                   dialogs and the `sek` currency pipe
infra/                      Optional Azure Bicep (legacy)
firestore.rules             Firestore security rules
```

## Data model

All data is stored as one `AppData` document: `players`, `transactions`, `sales`, `teamName` (default `P2012`) and `season`. Transaction types: `team_income`, `team_expense`, `player_income`, `player_expense`, `sale_team_share`, `sale_player_share`, `player_exit`.

> Because everything lives in a single Firestore document, it is subject to Firestore's 1 MiB document size limit – fine for one team, but worth keeping in mind over many seasons (use the JSON export for backups).
