import React, {createContext, useContext, useState} from 'react';
import {monsters, weapons, type GameLocation} from './gameData';
import {useProgress} from './useProgress';
import type {AuthUser} from './types';

const FLEE_SUCCESS_CHANCE = 0.4;

type BattleState = {
  monsterIndex: number;
  monsterHealth: number;
} | null;

type GameSessionContextValue = {
  user: AuthUser;
  progress: ReturnType<typeof useProgress>['progress'];
  loading: boolean;
  saving: boolean;
  error: string | null;
  message: string;
  battle: BattleState;
  currentWeaponName: string;
  activeMonsterName: string | null;
  save: () => Promise<void>;
  reload: () => Promise<void>;
  restart: () => Promise<void>;
  onLogout: () => void;
  goTown: () => void;
  goStore: () => void;
  goCave: () => void;
  buyHealth: () => void;
  buyWeapon: () => void;
  fightMonster: (monsterIndex: number) => void;
  attack: () => void;
  dodge: () => void;
  flee: () => boolean;
};

const GameSessionContext = createContext<GameSessionContextValue | null>(null);

type GameSessionProviderProps = {
  token: string;
  user: AuthUser;
  onLogout: () => void;
  children: React.ReactNode;
};

export function GameSessionProvider({
  token,
  user,
  onLogout,
  children,
}: GameSessionProviderProps): React.JSX.Element {
  const progressState = useProgress(token);
  const {progress, loading, saving, error} = progressState;
  const [battle, setBattle] = useState<BattleState>(null);
  const [message, setMessage] = useState(
    'Estas en la plaza del pueblo. Elige tu proximo movimiento.',
  );

  const currentWeapon = weapons[progress.currentWeaponIndex] ?? weapons[0];
  const activeMonster = battle ? monsters[battle.monsterIndex] : null;

  function setLocation(next: GameLocation) {
    progressState.setLocalProgress({location: next});
  }

  function goTown() {
    setBattle(null);
    setLocation('town');
    setMessage('Regresas a la plaza del pueblo.');
  }

  function goStore() {
    setBattle(null);
    setLocation('store');
    setMessage('Entras a la tienda.');
  }

  function goCave() {
    setBattle(null);
    setLocation('cave');
    setMessage('Entras a la cueva y escuchas ruidos extranos.');
  }

  function buyHealth() {
    if (progress.gold < 10) {
      setMessage('No tienes suficiente oro para curarte.');
      return;
    }
    progressState.updateProgress(prev => ({
      ...prev,
      gold: prev.gold - 10,
      health: Math.min(prev.health + 10, 100),
    }));
    setMessage('Compraste 10 de salud.');
  }

  function buyWeapon() {
    if (progress.currentWeaponIndex >= weapons.length - 1) {
      setMessage('Ya tienes el arma mas poderosa.');
      return;
    }
    const nextWeapon = weapons[progress.currentWeaponIndex + 1];
    if (progress.gold < nextWeapon.price) {
      setMessage('No tienes suficiente oro para comprar un arma.');
      return;
    }
    progressState.updateProgress(prev => ({
      ...prev,
      gold: prev.gold - nextWeapon.price,
      currentWeaponIndex: prev.currentWeaponIndex + 1,
      inventory: [...prev.inventory, nextWeapon.name],
    }));
    setMessage(`Compraste ${nextWeapon.name}.`);
  }

  function fightMonster(monsterIndex: number) {
    const monster = monsters[monsterIndex];
    setBattle({monsterIndex, monsterHealth: monster.health});
    setMessage(`Te enfrentas a ${monster.name}.`);
  }

  function loseGame() {
    setBattle(null);
    progressState.setLocalProgress({gameOver: true, wonDragon: false, location: 'town'});
    setMessage('Has muerto. Game Over.');
  }

  function winBattle(monsterIndex: number) {
    const monster = monsters[monsterIndex];
    progressState.updateProgress(prev => ({
      ...prev,
      xp: prev.xp + monster.level * 10,
      gold: prev.gold + monster.level * 20,
      wonDragon: monsterIndex === 2 ? true : prev.wonDragon,
      gameOver: false,
      location: 'town',
    }));
    setBattle(null);
    if (monsterIndex === 2) {
      setMessage('Derrotaste al Dragon. El pueblo esta a salvo.');
      return;
    }
    setMessage(
      `Derrotaste a ${monster.name}. Ganaste ${monster.level * 10} XP y ${monster.level * 20} de oro.`,
    );
  }

  function attack() {
    if (!battle) {
      return;
    }
    const monster = monsters[battle.monsterIndex];
    const damage = currentWeapon.damage + Math.floor(Math.random() * progress.xp);
    const nextMonsterHealth = battle.monsterHealth - damage;

    if (nextMonsterHealth <= 0) {
      winBattle(battle.monsterIndex);
      return;
    }

    const monsterDamage = monster.level * 10;
    const nextHealth = progress.health - monsterDamage;
    setBattle({
      ...battle,
      monsterHealth: nextMonsterHealth,
    });
    if (nextHealth <= 0) {
      loseGame();
      return;
    }
    progressState.setLocalProgress({health: nextHealth});
    setMessage(
      `Atacaste con ${currentWeapon.name} e hiciste ${damage} de dano. ${monster.name} te golpeo por ${monsterDamage}.`,
    );
  }

  function dodge() {
    if (!battle) {
      return;
    }
    const chance = Math.random();
    if (chance < 0.5) {
      setMessage('Lograste esquivar el ataque.');
      return;
    }
    const monster = monsters[battle.monsterIndex];
    const damage = monster.level * 10;
    const nextHealth = progress.health - damage;
    if (nextHealth <= 0) {
      loseGame();
      return;
    }
    progressState.setLocalProgress({health: nextHealth});
    setMessage(`Fallaste el esquive y recibiste ${damage} de dano.`);
  }

  function flee() {
    if (!battle) {
      return false;
    }

    const escaped = Math.random() < FLEE_SUCCESS_CHANCE;
    if (escaped) {
      setBattle(null);
      setLocation('town');
      setMessage('Conseguiste huir del combate.');
      return true;
    }

    const monster = monsters[battle.monsterIndex];
    const damage = Math.max(1, Math.floor(monster.level * 5));
    const nextHealth = progress.health - damage;
    if (nextHealth <= 0) {
      loseGame();
      return false;
    }
    progressState.setLocalProgress({health: nextHealth});
    setMessage(`No pudiste huir. ${monster.name} te golpeo por ${damage}.`);
    return false;
  }

  async function restart() {
    await progressState.reset();
    setBattle(null);
    setMessage('Partida reiniciada. Estas en la plaza del pueblo.');
  }

  const value: GameSessionContextValue = {
    user,
    progress,
    loading,
    saving,
    error,
    message,
    battle,
    currentWeaponName: currentWeapon.name,
    activeMonsterName: activeMonster ? activeMonster.name : null,
    save: progressState.save,
    reload: progressState.reload,
    restart,
    onLogout,
    goTown,
    goStore,
    goCave,
    buyHealth,
    buyWeapon,
    fightMonster,
    attack,
    dodge,
    flee,
  };

  return (
    <GameSessionContext.Provider value={value}>{children}</GameSessionContext.Provider>
  );
}

export function useGameSession() {
  const context = useContext(GameSessionContext);
  if (!context) {
    throw new Error('useGameSession debe usarse dentro de GameSessionProvider');
  }
  return context;
}
