import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TreasuryService } from '../../core/services/treasury.service';
import { SekPipe } from '../../shared/pipes/sek.pipe';
import { AddSaleDialogComponent } from '../../shared/dialogs/add-sale-dialog.component';
import { AddTransactionDialogComponent } from '../../shared/dialogs/add-transaction-dialog.component';
import { transactionIcon, transactionLabel, isTeamTransaction } from '../../core/models/transaction.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink, MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatTooltipModule, SekPipe,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  readonly treasury = inject(TreasuryService);
  private readonly dialog = inject(MatDialog);

  readonly topPlayers = computed(() =>
    this.treasury.activePlayers()
      .map(p => ({ ...p, balance: this.treasury.getPlayerBalance(p.id) }))
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5)
  );

  readonly totalBalance = computed(() =>
    this.treasury.teamBalance() + this.treasury.totalPlayerBalance()
  );

  readonly txIcon = transactionIcon;
  readonly txLabel = transactionLabel;
  readonly isteamTx = isTeamTransaction;

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  getPlayerName(id?: string): string {
    if (!id) return '';
    return this.treasury.getPlayer(id)?.name ?? '';
  }

  getTxClass(type: string): string {
    if (type.includes('expense')) return 'expense';
    if (type.includes('sale')) return 'sale';
    if (type === 'player_exit') return 'transfer';
    return 'income';
  }

  openSaleDialog() {
    this.dialog.open(AddSaleDialogComponent, { width: '560px' })
      .afterClosed().subscribe(result => {
        if (result) this.treasury.registerSale(result);
      });
  }

  openIncomeDialog() {
    this.dialog.open(AddTransactionDialogComponent, {
      width: '460px',
      data: { mode: 'team_income' },
    }).afterClosed().subscribe(r => {
      if (r) this.treasury.addTeamIncome(r.amount, r.description, r.category, r.date);
    });
  }

  openExpenseDialog() {
    this.dialog.open(AddTransactionDialogComponent, {
      width: '460px',
      data: { mode: 'team_expense' },
    }).afterClosed().subscribe(r => {
      if (r) this.treasury.addTeamExpense(r.amount, r.description, r.category, r.date);
    });
  }
}
