export interface Sale {
  id: string;
  date: string;
  productName: string;
  quantity: number;
  pricePerUnit: number;
  costPerUnit: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  teamShare: number;
  playerShare: number;
  playerId?: string;
  playerName?: string;
  description?: string;
  createdAt: string;
}
