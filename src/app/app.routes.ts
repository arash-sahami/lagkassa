import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: 'Dashboard – Lagkassan',
  },
  {
    path: 'spelare',
    loadComponent: () => import('./features/players/players.component').then(m => m.PlayersComponent),
    title: 'Spelare – Lagkassan',
  },
  {
    path: 'spelare/:id',
    loadComponent: () => import('./features/player-detail/player-detail.component').then(m => m.PlayerDetailComponent),
    title: 'Spelardetalj – Lagkassan',
  },
  {
    path: 'lagkassa',
    loadComponent: () => import('./features/team-treasury/team-treasury.component').then(m => m.TeamTreasuryComponent),
    title: 'Lagkassa – Lagkassan',
  },
  {
    path: 'forsaljning',
    loadComponent: () => import('./features/sales/sales.component').then(m => m.SalesComponent),
    title: 'Försäljning – Lagkassan',
  },
  {
    path: 'transaktioner',
    loadComponent: () => import('./features/transactions/transactions.component').then(m => m.TransactionsComponent),
    title: 'Transaktioner – Lagkassan',
  },
  { path: '**', redirectTo: 'dashboard' },
];
