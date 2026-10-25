import { Injectable } from '@angular/core';
import { Player } from '../models/player.model';
import { Transaction } from '../models/transaction.model';
import { Sale } from '../models/sale.model';

export interface AppData {
  players: Player[];
  transactions: Transaction[];
  sales: Sale[];
  teamName: string;
  season: string;
}

/** JSON file backup export/import. */
@Injectable({ providedIn: 'root' })
export class StorageService {
  exportJson(data: AppData): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lagkassa-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importJson(file: File): Promise<AppData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const parsed = JSON.parse(e.target!.result as string);
          if (!Array.isArray(parsed?.players) || !Array.isArray(parsed?.transactions) || !Array.isArray(parsed?.sales)) {
            throw new Error('Ogiltig fil');
          }
          resolve({
            players: parsed.players,
            transactions: parsed.transactions,
            sales: parsed.sales,
            teamName: parsed.teamName ?? 'P2012',
            season: parsed.season ?? '2025/2026',
          });
        } catch {
          reject(new Error('Ogiltig fil'));
        }
      };
      reader.onerror = () => reject(new Error('Kunde inte läsa filen'));
      reader.readAsText(file);
    });
  }
}
