import { Component, inject, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { TreasuryService } from '../../core/services/treasury.service';
import { SekPipe } from '../../shared/pipes/sek.pipe';
import { AddPlayerDialogComponent } from '../../shared/dialogs/add-player-dialog.component';

@Component({
  selector: 'app-players',
  standalone: true,
  imports: [
    RouterLink, MatCardModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatBadgeModule, MatTooltipModule,
    FormsModule, SekPipe,
  ],
  templateUrl: './players.component.html',
  styleUrl: './players.component.scss',
})
export class PlayersComponent {
  readonly treasury = inject(TreasuryService);
  private readonly dialog = inject(MatDialog);

  readonly search = signal('');
  readonly showInactive = signal(false);

  readonly filteredPlayers = computed(() => {
    const q = this.search().toLowerCase();
    const players = this.showInactive()
      ? this.treasury.players()
      : this.treasury.activePlayers();
    return players
      .filter(p => !q || p.name.toLowerCase().includes(q) || String(p.jerseyNumber ?? '').includes(q))
      .map(p => ({ ...p, balance: this.treasury.getPlayerBalance(p.id) }))
      .sort((a, b) => a.name.localeCompare(b.name, 'sv'));
  });

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  openAddDialog() {
    this.dialog.open(AddPlayerDialogComponent, { width: '520px', data: null })
      .afterClosed().subscribe(data => {
        if (data) this.treasury.addPlayer(data);
      });
  }
}
