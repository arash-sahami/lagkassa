import { Component, inject, computed, input, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TreasuryService } from '../../core/services/treasury.service';
import { SekPipe } from '../../shared/pipes/sek.pipe';
import { AddPlayerDialogComponent } from '../../shared/dialogs/add-player-dialog.component';
import { AddTransactionDialogComponent } from '../../shared/dialogs/add-transaction-dialog.component';
import { ConfirmDialogComponent } from '../../shared/dialogs/confirm-dialog.component';
import { transactionIcon, transactionLabel } from '../../core/models/transaction.model';

@Component({
  selector: 'app-player-detail',
  standalone: true,
  imports: [
    RouterLink, MatCardModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatChipsModule, SekPipe,
  ],
  templateUrl: './player-detail.component.html',
  styleUrl: './player-detail.component.scss',
})
export class PlayerDetailComponent {
  readonly id = input.required<string>();

  readonly treasury = inject(TreasuryService);
  private readonly dialog = inject(MatDialog);
  private readonly snackbar = inject(MatSnackBar);
  private readonly router = inject(Router);

  readonly player = computed(() => this.treasury.getPlayer(this.id()));
  readonly balance = computed(() => this.treasury.getPlayerBalance(this.id()));
  readonly transactions = computed(() => this.treasury.getPlayerTransactions(this.id()));
  readonly sales = computed(() => this.treasury.getPlayerSales(this.id()));

  readonly txIcon = transactionIcon;
  readonly txLabel = transactionLabel;

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  getTxClass(type: string): string {
    if (type.includes('expense')) return 'expense';
    if (type.includes('sale')) return 'sale';
    if (type === 'player_exit') return 'transfer';
    return 'income';
  }

  openEditDialog() {
    const player = this.player();
    if (!player) return;
    this.dialog.open(AddPlayerDialogComponent, { width: '520px', data: player })
      .afterClosed().subscribe(data => {
        if (data) this.treasury.updatePlayer(player.id, data);
      });
  }

  openIncomeDialog() {
    const player = this.player();
    if (!player) return;
    this.dialog.open(AddTransactionDialogComponent, {
      width: '460px',
      data: { mode: 'player_income', player },
    }).afterClosed().subscribe(r => {
      if (r) this.treasury.addPlayerIncome(player.id, r.amount, r.description, r.category, r.date);
    });
  }

  openExpenseDialog() {
    const player = this.player();
    if (!player) return;
    this.dialog.open(AddTransactionDialogComponent, {
      width: '460px',
      data: { mode: 'player_expense', player },
    }).afterClosed().subscribe(r => {
      if (r) this.treasury.addPlayerExpense(player.id, r.amount, r.description, r.category, r.date);
    });
  }

  openLeaveDialog() {
    const player = this.player();
    if (!player) return;
    const balance = this.balance();
    this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: `${player.name} lämnar laget`,
        message: balance > 0
          ? `Spelarens kassa på ${new Intl.NumberFormat('sv-SE').format(balance)} kr kommer att överföras till lagkassan. Är du säker?`
          : `Är du säker på att ${player.name} lämnar laget?`,
        confirmText: 'Ja, spelaren lämnar',
        confirmColor: 'warn',
        icon: 'transfer_within_a_station',
      },
    }).afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.treasury.playerLeaves(player.id);
        this.snackbar.open(`${player.name} har lämnat laget${balance > 0 ? ' och kassan är överförd' : ''}`, 'OK', { duration: 4000 });
        this.router.navigate(['/spelare']);
      }
    });
  }
}
