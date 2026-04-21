import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Player } from '../../core/models/player.model';

@Component({
  selector: 'app-add-player-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, ReactiveFormsModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Redigera spelare' : 'Lägg till spelare' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="player-form">
        <mat-form-field appearance="outline">
          <mat-label>Namn *</mat-label>
          <input matInput formControlName="name" placeholder="Förnamn Efternamn">
          @if (form.controls.name.errors?.['required']) {
            <mat-error>Namn är obligatoriskt</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Tröjnummer</mat-label>
          <input matInput type="number" formControlName="jerseyNumber" placeholder="ex. 10">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Förälders namn</mat-label>
          <input matInput formControlName="parentName" placeholder="Förälders namn">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Förälders telefon</mat-label>
          <input matInput formControlName="parentPhone" placeholder="07x-xxx xx xx">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Förälders e-post</mat-label>
          <input matInput type="email" formControlName="parentEmail" placeholder="epost@exempel.se">
          @if (form.controls.parentEmail.errors?.['email']) {
            <mat-error>Ogiltig e-postadress</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Anteckningar</mat-label>
          <textarea matInput formControlName="notes" rows="2" placeholder="Valfria anteckningar..."></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Avbryt</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid">
        {{ data ? 'Spara' : 'Lägg till' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .player-form {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 16px;
      padding-top: 8px;
      min-width: 420px;
    }
    mat-form-field { width: 100%; }
    .full-width { grid-column: 1 / -1; }
    @media (max-width: 480px) {
      .player-form { grid-template-columns: 1fr; min-width: unset; }
    }
  `],
})
export class AddPlayerDialogComponent {
  readonly data = inject<Player | null>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<AddPlayerDialogComponent>);
  private readonly fb = inject(FormBuilder);

  form = this.fb.group({
    name:        [this.data?.name ?? '', Validators.required],
    jerseyNumber:[this.data?.jerseyNumber ?? null as number | null],
    parentName:  [this.data?.parentName ?? ''],
    parentPhone: [this.data?.parentPhone ?? ''],
    parentEmail: [this.data?.parentEmail ?? '', Validators.email],
    notes:       [this.data?.notes ?? ''],
  });

  save() {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.ref.close({
      name: v.name!.trim(),
      jerseyNumber: v.jerseyNumber ?? undefined,
      parentName: v.parentName?.trim() || undefined,
      parentPhone: v.parentPhone?.trim() || undefined,
      parentEmail: v.parentEmail?.trim() || undefined,
      notes: v.notes?.trim() || undefined,
    });
  }
}
