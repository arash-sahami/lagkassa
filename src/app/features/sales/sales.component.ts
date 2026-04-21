import { Component, inject, signal, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TreasuryService } from '../../core/services/treasury.service';
import { SekPipe } from '../../shared/pipes/sek.pipe';
import { AddSaleDialogComponent } from '../../shared/dialogs/add-sale-dialog.component';
import { ConfirmDialogComponent } from '../../shared/dialogs/confirm-dialog.component';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatChipsModule, SekPipe],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.scss',
})
export class SalesComponent {
  readonly treasury = inject(TreasuryService);
  private readonly dialog = inject(MatDialog);
  private readonly snackbar = inject(MatSnackBar);

  readonly displayedColumns = ['date', 'product', 'quantity', 'revenue', 'profit', 'teamShare', 'playerShare', 'player', 'actions'];

  readonly sortedSales = computed(() =>
    [...this.treasury.sales()].sort((a, b) => b.date.localeCompare(a.date))
  );

  readonly totalRevenue = computed(() => this.treasury.sales().reduce((s, x) => s + x.totalRevenue, 0));
  readonly totalProfit = computed(() => this.treasury.sales().reduce((s, x) => s + x.totalProfit, 0));
  readonly totalTeamShare = computed(() => this.treasury.sales().reduce((s, x) => s + x.teamShare, 0));

  openSaleDialog() {
    this.dialog.open(AddSaleDialogComponent, { width: '560px' })
      .afterClosed().subscribe(result => {
        if (result) {
          this.treasury.registerSale(result);
          this.snackbar.open('Försäljning registrerad!', 'OK', { duration: 3000 });
        }
      });
  }

  confirmDelete(id: string, name: string) {
    this.dialog.open(ConfirmDialogComponent, {
      width: '380px',
      data: {
        title: 'Ta bort försäljning',
        message: `Ta bort "${name}"? Tillhörande transaktioner tas också bort.`,
        confirmText: 'Ta bort',
        confirmColor: 'warn',
        icon: 'delete',
      },
    }).afterClosed().subscribe(ok => {
      if (ok) {
        this.treasury.deleteSale(id);
        this.snackbar.open('Försäljning borttagen', 'OK', { duration: 2500 });
      }
    });
  }
}
