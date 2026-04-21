import { Component, inject, input } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import { TransactionCategory, TRANSACTION_CATEGORIES, TransactionType } from '../../core/models/transaction.model';
import { TreasuryService } from '../../core/services/treasury.service';
import { Player } from '../../core/models/player.model';

export type TxDialogMode = 'team_income' | 'team_expense' | 'player_income' | 'player_expense';

export interface TxDialogData {
  mode: TxDialogMode;
  player?: Player;
}

@Component({
  selector: 'app-add-transaction-dialog',
  standalone: true,
  imports: [
    MatDialogModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatIconModule, ReactiveFormsModule, TitleCasePipe,
  ],
  template: `
    <h2 mat-dialog-title>{{ title }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="tx-form">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Belopp (kr) *</mat-label>
          <input matInput type="number" formControlName="amount" min="1" placeholder="0">
          <span matTextSuffix>kr</span>
          @if (form.controls.amount.errors?.['min']) {
            <mat-error>Beloppet måste vara större än 0</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full">
          <mat-label>Beskrivning *</mat-label>
          <input matInput formControlName="description" placeholder="ex. Cupiavgift, Träningsavgift...">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Datum *</mat-label>
          <input matInput type="date" formControlName="date">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Kategori</mat-label>
          <mat-select formControlName="category">
            @for (cat of categories; track cat) {
              <mat-option [value]="cat">{{ cat | titlecase }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Avbryt</button>
      <button mat-flat-button [color]="isExpense ? 'warn' : 'primary'" (click)="save()" [disabled]="form.invalid">
        Spara
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .tx-form {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 16px;
      padding-top: 8px;
      min-width: 380px;
    }
    mat-form-field { width: 100%; }
    .full { grid-column: 1 / -1; }
  `],
})
export class AddTransactionDialogComponent {
  readonly data = inject<TxDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<AddTransactionDialogComponent>);
  private readonly fb = inject(FormBuilder);

  readonly categories = TRANSACTION_CATEGORIES;
  readonly isExpense = this.data.mode.includes('expense');

  get title(): string {
    switch (this.data.mode) {
      case 'team_income':   return 'Lägg till lagintäkt';
      case 'team_expense':  return 'Lägg till lagutgift';
      case 'player_income': return `Intäkt – ${this.data.player?.name ?? 'Spelare'}`;
      case 'player_expense':return `Utgift – ${this.data.player?.name ?? 'Spelare'}`;
    }
  }

  form = this.fb.group({
    amount:      [null as number | null, [Validators.required, Validators.min(1)]],
    description: ['', Validators.required],
    date:        [new Date().toISOString().slice(0, 10), Validators.required],
    category:    ['övrigt' as TransactionCategory, Validators.required],
  });

  save() {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.ref.close({
      mode: this.data.mode,
      amount: +v.amount!,
      description: v.description!.trim(),
      date: v.date!,
      category: v.category as TransactionCategory,
    });
  }
}
