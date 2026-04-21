import { Injectable, signal, computed, inject } from '@angular/core';
import { StorageService, AppData } from './storage.service';
import { Player, AVATAR_COLORS } from '../models/player.model';
import { Transaction, TransactionType, TransactionCategory, isTeamTransaction } from '../models/transaction.model';
import { Sale } from '../models/sale.model';

@Injectable({ providedIn: 'root' })
export class TreasuryService {
  private readonly storage = inject(StorageService);
  private readonly _data = signal<AppData>(this.storage.load());

  // ── Derived state ──────────────────────────────────────────────
  readonly players = computed(() => this._data().players);
  readonly activePlayers = computed(() => this._data().players.filter(p => p.active));
  readonly inactivePlayers = computed(() => this._data().players.filter(p => !p.active));
  readonly transactions = computed(() => this._data().transactions);
  readonly sales = computed(() => this._data().sales);
  readonly teamName = computed(() => this._data().teamName);
  readonly season = computed(() => this._data().season);

  readonly teamBalance = computed(() =>
    this._data().transactions
      .filter(t => isTeamTransaction(t.type))
      .reduce((sum, t) => {
        if (t.type === 'team_expense') return sum - t.amount;
        return sum + t.amount;
      }, 0)
  );

  readonly totalPlayerBalance = computed(() =>
    this._data().players
      .filter(p => p.active)
      .reduce((sum, p) => sum + this.getPlayerBalance(p.id), 0)
  );

  readonly recentTransactions = computed(() =>
    [...this._data().transactions]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 10)
  );

  readonly teamTransactions = computed(() =>
    [...this._data().transactions]
      .filter(t => isTeamTransaction(t.type))
      .sort((a, b) => b.date.localeCompare(a.date))
  );

  // ── Player helpers ─────────────────────────────────────────────
  getPlayer(id: string): Player | undefined {
    return this._data().players.find(p => p.id === id);
  }

  getPlayerBalance(playerId: string): number {
    return this._data().transactions
      .filter(t => t.playerId === playerId && t.type !== 'player_exit')
      .reduce((sum, t) => {
        if (t.type === 'sale_player_share' || t.type === 'player_income') return sum + t.amount;
        if (t.type === 'player_expense') return sum - t.amount;
        return sum;
      }, 0);
  }

  getPlayerTransactions(playerId: string): Transaction[] {
    return [...this._data().transactions]
      .filter(t => t.playerId === playerId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  getPlayerSales(playerId: string): Sale[] {
    return [...this._data().sales]
      .filter(s => s.playerId === playerId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  // ── Player CRUD ────────────────────────────────────────────────
  addPlayer(data: Omit<Player, 'id' | 'avatarColor' | 'active' | 'joinDate'>): Player {
    const player: Player = {
      ...data,
      id: crypto.randomUUID(),
      active: true,
      joinDate: new Date().toISOString().slice(0, 10),
      avatarColor: AVATAR_COLORS[this._data().players.length % AVATAR_COLORS.length],
    };
    this.update(d => ({ ...d, players: [...d.players, player] }));
    return player;
  }

  updatePlayer(id: string, changes: Partial<Player>): void {
    this.update(d => ({
      ...d,
      players: d.players.map(p => p.id === id ? { ...p, ...changes } : p),
    }));
  }

  playerLeaves(playerId: string): void {
    const balance = this.getPlayerBalance(playerId);
    const player = this.getPlayer(playerId);
    if (!player) return;

    const transactions: Transaction[] = [];

    if (balance > 0) {
      transactions.push(this.makeTransaction({
        type: 'player_exit',
        amount: balance,
        description: `Överföring från ${player.name} (lämnade laget)`,
        category: 'övrigt',
        playerId,
        date: new Date().toISOString().slice(0, 10),
      }));
    }

    this.update(d => ({
      ...d,
      players: d.players.map(p =>
        p.id === playerId
          ? { ...p, active: false, leaveDate: new Date().toISOString().slice(0, 10) }
          : p
      ),
      transactions: [...d.transactions, ...transactions],
    }));
  }

  // ── Sales ──────────────────────────────────────────────────────
  registerSale(input: {
    date: string;
    productName: string;
    quantity: number;
    pricePerUnit: number;
    costPerUnit: number;
    playerId?: string;
    description?: string;
  }): void {
    const totalRevenue = input.quantity * input.pricePerUnit;
    const totalCost = input.quantity * input.costPerUnit;
    const totalProfit = totalRevenue - totalCost;
    const playerShare = input.playerId ? Math.round(totalProfit * 0.5 * 100) / 100 : 0;
    const teamShare = Math.round((totalProfit - playerShare) * 100) / 100;

    const playerName = input.playerId ? this.getPlayer(input.playerId)?.name : undefined;

    const sale: Sale = {
      id: crypto.randomUUID(),
      date: input.date,
      productName: input.productName,
      quantity: input.quantity,
      pricePerUnit: input.pricePerUnit,
      costPerUnit: input.costPerUnit,
      totalRevenue,
      totalCost,
      totalProfit,
      teamShare,
      playerShare,
      playerId: input.playerId,
      playerName,
      description: input.description,
      createdAt: new Date().toISOString(),
    };

    const newTransactions: Transaction[] = [
      this.makeTransaction({
        type: 'sale_team_share',
        amount: teamShare,
        description: `Lagandel – ${input.productName}${playerName ? ' (' + playerName + ')' : ''}`,
        category: 'försäljning',
        saleId: sale.id,
        date: input.date,
      }),
    ];

    if (input.playerId && playerShare > 0) {
      newTransactions.push(this.makeTransaction({
        type: 'sale_player_share',
        amount: playerShare,
        description: `Spelarandel – ${input.productName}`,
        category: 'försäljning',
        playerId: input.playerId,
        saleId: sale.id,
        date: input.date,
      }));
    }

    this.update(d => ({
      ...d,
      sales: [...d.sales, sale],
      transactions: [...d.transactions, ...newTransactions],
    }));
  }

  deleteSale(saleId: string): void {
    this.update(d => ({
      ...d,
      sales: d.sales.filter(s => s.id !== saleId),
      transactions: d.transactions.filter(t => t.saleId !== saleId),
    }));
  }

  // ── Manual transactions ────────────────────────────────────────
  addTeamIncome(amount: number, description: string, category: TransactionCategory, date: string): void {
    this.addTx({ type: 'team_income', amount, description, category, date });
  }

  addTeamExpense(amount: number, description: string, category: TransactionCategory, date: string): void {
    this.addTx({ type: 'team_expense', amount, description, category, date });
  }

  addPlayerIncome(playerId: string, amount: number, description: string, category: TransactionCategory, date: string): void {
    this.addTx({ type: 'player_income', amount, description, category, date, playerId });
  }

  addPlayerExpense(playerId: string, amount: number, description: string, category: TransactionCategory, date: string): void {
    this.addTx({ type: 'player_expense', amount, description, category, date, playerId });
  }

  deleteTransaction(id: string): void {
    this.update(d => ({ ...d, transactions: d.transactions.filter(t => t.id !== id) }));
  }

  // ── Settings ───────────────────────────────────────────────────
  updateSettings(teamName: string, season: string): void {
    this.update(d => ({ ...d, teamName, season }));
  }

  exportData(): void {
    this.storage.exportJson(this._data());
  }

  async importData(file: File): Promise<void> {
    const data = await this.storage.importJson(file);
    this._data.set(data);
    this.storage.save(data);
  }

  // ── Private helpers ────────────────────────────────────────────
  private addTx(opts: Omit<Transaction, 'id' | 'createdAt'>): void {
    this.update(d => ({
      ...d,
      transactions: [...d.transactions, this.makeTransaction(opts)],
    }));
  }

  private makeTransaction(opts: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
    return { ...opts, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  }

  private update(fn: (d: AppData) => AppData): void {
    this._data.update(fn);
    this.storage.save(this._data());
  }
}
