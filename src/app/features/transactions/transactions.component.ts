import { Component, inject, signal, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { TreasuryService } from '../../core/services/treasury.service';
import { SekPipe } from '../../shared/pipes/sek.pipe';
import { transactionIcon, transactionLabel, TransactionType } from '../../core/models/transaction.model';
import { Transaction } from '../../core/models/transaction.model';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    MatCardModule, MatButtonModule, MatIconModule,
    MatSelectModule, MatFormFieldModule, MatInputModule,
    FormsModule, SekPipe,
  ],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss',
})
export class TransactionsComponent {
  readonly treasury = inject(TreasuryService);

  readonly filterType = signal<string>('all');
  readonly filterPlayer = signal<string>('all');
  readonly filterFrom = signal<string>('');
  readonly filterTo = signal<string>('');

  readonly txIcon = transactionIcon;
  readonly txLabel = transactionLabel;

  readonly typeOptions = [
    { value: 'all',               label: 'Alla typer' },
    { value: 'team_income',       label: 'Lagintäkt' },
    { value: 'team_expense',      label: 'Lagutgift' },
    { value: 'player_income',     label: 'Spelarintäkt' },
    { value: 'player_expense',    label: 'Spelarutgift' },
    { value: 'sale_team_share',   label: 'Lagandel försäljning' },
    { value: 'sale_player_share', label: 'Spelarandel försäljning' },
    { value: 'player_exit',       label: 'Spelaravgång' },
  ];

  readonly filteredTransactions = computed(() => {
    let txs = [...this.treasury.transactions()];

    if (this.filterType() !== 'all') {
      txs = txs.filter(t => t.type === this.filterType());
    }
    if (this.filterPlayer() !== 'all') {
      txs = txs.filter(t => t.playerId === this.filterPlayer());
    }
    if (this.filterFrom()) {
      txs = txs.filter(t => t.date >= this.filterFrom());
    }
    if (this.filterTo()) {
      txs = txs.filter(t => t.date <= this.filterTo());
    }

    return txs.sort((a, b) => b.date.localeCompare(a.date));
  });

  readonly totalFiltered = computed(() =>
    this.filteredTransactions().reduce((sum, t) => {
      const isDebit = t.type === 'team_expense' || t.type === 'player_expense';
      return sum + (isDebit ? -t.amount : t.amount);
    }, 0)
  );

  getPlayerName(id?: string): string {
    if (!id) return '–';
    return this.treasury.getPlayer(id)?.name ?? id;
  }

  getTxClass(type: string): string {
    if (type.includes('expense')) return 'expense';
    if (type.includes('sale')) return 'sale';
    if (type === 'player_exit') return 'transfer';
    return 'income';
  }

  isDebit(type: TransactionType): boolean {
    return type === 'team_expense' || type === 'player_expense';
  }

  resetFilters() {
    this.filterType.set('all');
    this.filterPlayer.set('all');
    this.filterFrom.set('');
    this.filterTo.set('');
  }

  exportCsv() {
    const rows = [
      ['Datum', 'Typ', 'Beskrivning', 'Kategori', 'Belopp', 'Spelare'],
      ...this.filteredTransactions().map(t => [
        t.date,
        transactionLabel(t.type),
        t.description,
        t.category,
        (this.isDebit(t.type) ? -t.amount : t.amount).toString(),
        this.getPlayerName(t.playerId),
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transaktioner-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
