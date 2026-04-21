export type TransactionType =
  | 'team_income'
  | 'team_expense'
  | 'player_income'
  | 'player_expense'
  | 'sale_team_share'
  | 'sale_player_share'
  | 'player_exit';

export type TransactionCategory =
  | 'försäljning'
  | 'cuper'
  | 'utrustning'
  | 'resor'
  | 'träning'
  | 'övrigt';

export const TRANSACTION_CATEGORIES: TransactionCategory[] = [
  'försäljning', 'cuper', 'utrustning', 'resor', 'träning', 'övrigt',
];

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: TransactionCategory;
  playerId?: string;
  saleId?: string;
  createdAt: string;
}

export function isCredit(type: TransactionType): boolean {
  return ['team_income', 'player_income', 'sale_team_share', 'sale_player_share', 'player_exit'].includes(type);
}

export function isTeamTransaction(type: TransactionType): boolean {
  return ['team_income', 'team_expense', 'sale_team_share', 'player_exit'].includes(type);
}

export function isPlayerTransaction(type: TransactionType): boolean {
  return ['player_income', 'player_expense', 'sale_player_share'].includes(type);
}

export function transactionIcon(type: TransactionType): string {
  switch (type) {
    case 'team_income': return 'add_circle';
    case 'team_expense': return 'remove_circle';
    case 'player_income': return 'person_add';
    case 'player_expense': return 'person_remove';
    case 'sale_team_share': return 'store';
    case 'sale_player_share': return 'sell';
    case 'player_exit': return 'transfer_within_a_station';
  }
}

export function transactionLabel(type: TransactionType): string {
  switch (type) {
    case 'team_income': return 'Lagintäkt';
    case 'team_expense': return 'Lagutgift';
    case 'player_income': return 'Spelarintäkt';
    case 'player_expense': return 'Spelarutgift';
    case 'sale_team_share': return 'Lagandel försäljning';
    case 'sale_player_share': return 'Spelarandel försäljning';
    case 'player_exit': return 'Spelaravgång – överfört till laget';
  }
}
