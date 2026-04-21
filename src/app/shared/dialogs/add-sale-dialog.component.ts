import { Component, inject, computed } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { TreasuryService } from '../../core/services/treasury.service';
import { SekPipe } from '../pipes/sek.pipe';

@Component({
  selector: 'app-add-sale-dialog',
  standalone: true,
  imports: [
    MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDividerModule, MatIconModule,
    ReactiveFormsModule, SekPipe,
  ],
  template: `
    <h2 mat-dialog-title>Registrera försäljning</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="sale-form">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Produkt *</mat-label>
          <input matInput formControlName="productName" placeholder="ex. Lotter, Choklad...">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full">
          <mat-label>Datum *</mat-label>
          <input matInput type="date" formControlName="date">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Antal *</mat-label>
          <input matInput type="number" formControlName="quantity" min="1">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Pris per st (kr) *</mat-label>
          <input matInput type="number" formControlName="pricePerUnit" min="0">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Kostnad per st (kr)</mat-label>
          <input matInput type="number" formControlName="costPerUnit" min="0">
          <mat-hint>Inköpspris eller 0 om inga kostnader</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Tilldela spelare</mat-label>
          <mat-select formControlName="playerId">
            <mat-option [value]="null">Hela laget</mat-option>
            @for (p of players(); track p.id) {
              <mat-option [value]="p.id">{{ p.name }}</mat-option>
            }
          </mat-select>
          <mat-hint>Välj spelare för 50/50-delning</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full">
          <mat-label>Anteckning</mat-label>
          <input matInput formControlName="description" placeholder="Valfri anteckning...">
        </mat-form-field>

        <mat-divider class="full divider"></mat-divider>

        <div class="summary full">
          <h3>Beräkning</h3>
          <div class="calc-row">
            <span>Total intäkt</span>
            <strong>{{ calc().revenue | sek }}</strong>
          </div>
          <div class="calc-row">
            <span>Total kostnad</span>
            <strong class="neg">{{ calc().cost | sek }}</strong>
          </div>
          <div class="calc-row profit-row">
            <span>Vinst</span>
            <strong>{{ calc().profit | sek }}</strong>
          </div>
          <mat-divider></mat-divider>
          <div class="calc-row">
            <span>Lagandel ({{ hasPlayer() ? '50%' : '100%' }})</span>
            <strong class="pos">{{ calc().teamShare | sek }}</strong>
          </div>
          @if (hasPlayer()) {
            <div class="calc-row">
              <span>Spelarandel (50%)</span>
              <strong class="pos">{{ calc().playerShare | sek }}</strong>
            </div>
          }
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Avbryt</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid">
        Registrera
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .sale-form {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 16px;
      padding-top: 8px;
      min-width: 460px;
    }
    mat-form-field { width: 100%; }
    .full { grid-column: 1 / -1; }
    .divider { margin: 8px 0; }
    .summary h3 { margin: 0 0 12px; font-size: 0.95rem; color: #555; }
    .calc-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      font-size: 0.9rem;
      color: #444;
      border-bottom: 1px solid #f0f0f0;
      &:last-child { border: none; }
    }
    .profit-row { font-weight: 600; }
    .pos { color: #2e7d32; }
    .neg { color: #c62828; }
    @media (max-width: 500px) {
      .sale-form { grid-template-columns: 1fr; min-width: unset; }
    }
  `],
})
export class AddSaleDialogComponent {
  private readonly ref = inject(MatDialogRef<AddSaleDialogComponent>);
  private readonly fb = inject(FormBuilder);
  private readonly treasury = inject(TreasuryService);

  readonly players = this.treasury.activePlayers;

  form = this.fb.group({
    productName:  ['', Validators.required],
    date:         [new Date().toISOString().slice(0, 10), Validators.required],
    quantity:     [1, [Validators.required, Validators.min(1)]],
    pricePerUnit: [0, [Validators.required, Validators.min(0)]],
    costPerUnit:  [0, Validators.min(0)],
    playerId:     [null as string | null],
    description:  [''],
  });

  private readonly formValues = toSignal(this.form.valueChanges, { initialValue: this.form.value });

  readonly hasPlayer = computed(() => !!this.formValues()?.playerId);

  readonly calc = computed(() => {
    const v = this.formValues();
    const qty = +(v?.quantity ?? 0);
    const price = +(v?.pricePerUnit ?? 0);
    const cost = +(v?.costPerUnit ?? 0);
    const revenue = qty * price;
    const totalCost = qty * cost;
    const profit = revenue - totalCost;
    const playerShare = v?.playerId ? Math.round(profit * 0.5 * 100) / 100 : 0;
    const teamShare = Math.round((profit - playerShare) * 100) / 100;
    return { revenue, cost: totalCost, profit, teamShare, playerShare };
  });

  save() {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.ref.close({
      date: v.date!,
      productName: v.productName!.trim(),
      quantity: +v.quantity!,
      pricePerUnit: +v.pricePerUnit!,
      costPerUnit: +(v.costPerUnit ?? 0),
      playerId: v.playerId ?? undefined,
      description: v.description?.trim() || undefined,
    });
  }
}
