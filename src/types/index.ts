export interface Player {
  id: string;
  name: string;
}

export interface Match {
  id: string;
  players: [Player, Player] | [Player, Player, Player] | [Player, Player, Player, Player];
  court: number;
  side: 'left' | 'right';
}

export interface Session {
  players: Player[];
  numberOfCourts: number;
  matches: Match[];
} 