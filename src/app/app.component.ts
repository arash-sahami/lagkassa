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

  async logout() {
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}
