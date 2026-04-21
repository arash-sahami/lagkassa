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

const STORAGE_KEY = 'lagkassa_v1';

@Injectable({ providedIn: 'root' })
export class StorageService {
  load(): AppData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as AppData;
    } catch { /* ignore */ }
    return { players: [], transactions: [], sales: [], teamName: 'P2012', season: '2025/2026' };
  }

  save(data: AppData): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

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
          resolve(JSON.parse(e.target!.result as string) as AppData);
        } catch {
          reject(new Error('Ogiltig fil'));
        }
      };
      reader.onerror = () => reject(new Error('Kunde inte läsa filen'));
      reader.readAsText(file);
    });
  }
}
