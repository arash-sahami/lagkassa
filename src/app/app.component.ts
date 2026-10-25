import { Component, signal, computed, inject, effect } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { filter } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from './shared/dialogs/confirm-dialog.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { TreasuryService } from './core/services/treasury.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatSidenavModule, MatListModule,
    MatIconModule, MatButtonModule, MatTooltipModule, DecimalPipe,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly breakpoint = inject(BreakpointObserver);
  private readonly router = inject(Router);
  readonly treasury = inject(TreasuryService);
  readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackbar = inject(MatSnackBar);

  readonly isMobile = toSignal(
    this.breakpoint.observe([Breakpoints.Handset]),
    { initialValue: { matches: false, breakpoints: {} } }
  );

  readonly sidenavOpened = signal(true);
  readonly sidenavMode = computed(() => this.isMobile().matches ? 'over' : 'side');
  readonly isLoggedIn = computed(() => this.auth.currentUser() != null && this.auth.currentUser() !== undefined);

  readonly navItems = [
    { path: '/dashboard',     icon: 'dashboard',       label: 'Dashboard' },
    { path: '/spelare',       icon: 'group',           label: 'Spelare' },
    { path: '/lagkassa',      icon: 'account_balance', label: 'Lagkassa' },
    { path: '/forsaljning',   icon: 'point_of_sale',   label: 'Försäljning' },
    { path: '/transaktioner', icon: 'receipt_long',    label: 'Transaktioner' },
  ];

  constructor() {
    effect(() => {
      this.sidenavOpened.set(!this.isMobile().matches);
    });

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.isMobile().matches) this.sidenavOpened.set(false);
    });
  }

  toggleSidenav() {
    this.sidenavOpened.update(v => !v);
  }

  async invite() {
    // Lazy-loaded so the QR library isn't part of the initial bundle
    const { InviteDialogComponent } = await import('./shared/dialogs/invite-dialog.component');
    this.dialog.open(InviteDialogComponent, { width: '360px', maxWidth: '95vw' });
  }

  async importBackup(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const confirmed = await firstValueFrom(this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Importera backup',
        message: `All nuvarande data ersätts med innehållet i "${file.name}". Det går inte att ångra. Exportera en backup först om du är osäker.`,
        confirmText: 'Ersätt data',
        confirmColor: 'warn',
        icon: 'warning',
      },
    }).afterClosed());
    if (!confirmed) return;

    try {
      await this.treasury.importBackup(file);
      this.snackbar.open('Backup importerad', 'OK', { duration: 3000 });
    } catch (e) {
      this.snackbar.open((e as Error).message || 'Kunde inte importera filen', 'OK', { duration: 4000 });
    }
  }

  async logout() {
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}
