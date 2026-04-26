import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent),
    title: 'Logga in – Lagkassan',
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: 'Dashboard – Lagkassan',
    canActivate: [authGuard],
  },
  {
    path: 'spelare',
    loadComponent: () => import('./features/players/players.component').then(m => m.PlayersComponent),
    title: 'Spelare – Lagkassan',
    canActivate: [authGuard],
  },
  {
    path: 'spelare/:id',
    loadComponent: () => import('./features/player-detail/player-detail.component').then(m => m.PlayerDetailComponent),
    title: 'Spelardetalj – Lagkassan',
    canActivate: [authGuard],
  },
  {
    path: 'lagkassa',
    loadComponent: () => import('./features/team-treasury/team-treasury.component').then(m => m.TeamTreasuryComponent),
    title: 'Lagkassa – Lagkassan',
    canActivate: [authGuard],
  },
  {
    path: 'forsaljning',
    loadComponent: () => import('./features/sales/sales.component').then(m => m.SalesComponent),
    title: 'Försäljning – Lagkassan',
    canActivate: [authGuard],
  },
  {
    path: 'transaktioner',
    loadComponent: () => import('./features/transactions/transactions.component').then(m => m.TransactionsComponent),
    title: 'Transaktioner – Lagkassan',
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: 'dashboard' },
];
