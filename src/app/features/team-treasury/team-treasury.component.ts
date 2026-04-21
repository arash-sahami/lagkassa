import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { TreasuryService } from '../../core/services/treasury.service';
import { SekPipe } from '../../shared/pipes/sek.pipe';
import { AddTransactionDialogComponent } from '../../shared/dialogs/add-transaction-dialog.component';
import { ConfirmDialogComponent } from '../../shared/dialogs/confirm-dialog.component';
import { transactionIcon, transactionLabel } from '../../core/models/transaction.model';

@Component({
  selector: 'app-team-treasury',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, SekPipe],
  templateUrl: './team-treasury.component.html',
  styleUrl: './team-treasury.component.scss',
})
export class TeamTreasuryComponent {
  readonly treasury = inject(TreasuryService);
  private readonly dialog = inject(MatDialog);

  readonly txIcon = transactionIcon;
  readonly txLabel = transactionLabel;

  getTxClass(type: string): string {
    if (type === 'team_expense') return 'expense';
    if (type === 'sale_team_share') return 'sale';
    if (type === 'player_exit') return 'transfer';
    return 'income';
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

  confirmDelete(id: string, description: string) {
    this.dialog.open(ConfirmDialogComponent, {
      width: '380px',
      data: {
        title: 'Ta bort transaktion',
        message: `Är du säker på att du vill ta bort "${description}"?`,
        confirmText: 'Ta bort',
        confirmColor: 'warn',
        icon: 'delete',
      },
    }).afterClosed().subscribe(ok => {
      if (ok) this.treasury.deleteTransaction(id);
    });
  }
}
