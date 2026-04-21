export interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  active: boolean;
  joinDate: string;
  leaveDate?: string;
  avatarColor: string;
  notes?: string;
}

export const AVATAR_COLORS = [
  '#1565c0', '#6a1b9a', '#ad1457', '#c62828',
  '#e65100', '#2e7d32', '#00695c', '#0277bd',
  '#4527a0', '#37474f', '#558b2f', '#6d4c41',
];
