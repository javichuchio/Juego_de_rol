export type PlayerProgress = {
  xp: number;
  health: number;
  gold: number;
  currentWeaponIndex: number;
  inventory: string[];
  location: string;
  wonDragon: boolean;
  gameOver: boolean;
};

export type AuthUser = {
  id: number;
  username: string;
};
