import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import QRCode from 'qrcode';
import { InvitationService } from '../../core/services/invitation.service';

@Component({
  selector: 'app-invite-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, DatePipe],
  template: `
    <h2 mat-dialog-title>Bjud in administratör</h2>
    <mat-dialog-content class="invite-content">
      @if (error()) {
        <p class="error">{{ error() }}</p>
      } @else if (!qrDataUrl()) {
        <mat-spinner diameter="40" />
      } @else {
        <p>Låt personen skanna QR-koden för att skapa ett konto och välja lösenord.</p>
        <img [src]="qrDataUrl()" alt="QR-kod för inbjudan" class="qr" />
        <p class="hint">
          Kan användas en gång. Giltig till {{ expiresAt() | date:'yyyy-MM-dd HH:mm' }}.
        </p>
        <button mat-stroked-button (click)="copyLink()">
          <mat-icon>content_copy</mat-icon> Kopiera länk
        </button>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Stäng</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .invite-content { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px; }
    .qr { width: 256px; height: 256px; max-width: 100%; }
    .hint { font-size: 0.8rem; color: rgba(0,0,0,0.6); margin: 0; }
    .error { color: #c62828; }
  `],
})
export class InviteDialogComponent implements OnInit {
  private readonly invitations = inject(InvitationService);
  private readonly snackbar    = inject(MatSnackBar);

  readonly qrDataUrl = signal('');
  readonly expiresAt = signal<Date | null>(null);
  readonly error     = signal('');
  private link = '';

  async ngOnInit() {
    try {
      const { token, expiresAt } = await this.invitations.create();
      this.link = this.invitations.registerUrl(token);
      this.expiresAt.set(expiresAt);
      this.qrDataUrl.set(await QRCode.toDataURL(this.link, { width: 512, margin: 1 }));
    } catch (e) {
      console.error('Create invitation failed:', e);
      this.error.set('Kunde inte skapa inbjudan.');
    }
  }

  async copyLink() {
    await navigator.clipboard.writeText(this.link);
    this.snackbar.open('Länk kopierad', 'OK', { duration: 2000 });
  }
}
