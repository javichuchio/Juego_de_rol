export type Weapon = {
  name: string;
  damage: number;
  price: number;
};

export type Monster = {
  name: string;
  health: number;
  level: number;
};

export const weapons: Weapon[] = [
  {name: 'Palo', damage: 5, price: 0},
  {name: 'Daga', damage: 30, price: 30},
  {name: 'Martillo de Garra', damage: 50, price: 30},
  {name: 'Espada de fuego', damage: 100, price: 30},
];

export const monsters: Monster[] = [
  {name: 'Bestia con colmillos', health: 60, level: 4},
  {name: 'Caminante blanco', health: 100, level: 8},
  {name: 'Dragon', health: 500, level: 20},
];

export type GameLocation = 'town' | 'store' | 'cave';
