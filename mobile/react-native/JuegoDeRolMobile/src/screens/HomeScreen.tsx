import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type {AuthUser} from '../state/types';
import {useProgress} from '../state/useProgress';
import {monsters, weapons, type GameLocation} from '../state/gameData';
import TownScreen from './game/TownScreen';
import StoreScreen from './game/StoreScreen';
import CaveScreen from './game/CaveScreen';
import BattleScreen from './game/BattleScreen';

type HomeScreenProps = {
  token: string;
  user: AuthUser;
  onLogout: () => void;
};

export default function HomeScreen({
  token,
  user,
  onLogout,
}: HomeScreenProps): React.JSX.Element {
  const progressState = useProgress(token);
  const {progress, loading, saving, error} = progressState;
  const [battle, setBattle] = React.useState<{
    monsterIndex: number;
    monsterHealth: number;
  } | null>(null);
  const [message, setMessage] = React.useState(
    'Estas en la plaza del pueblo. Elige tu proximo movimiento.',
  );

  const currentWeapon = weapons[progress.currentWeaponIndex] ?? weapons[0];
  const location = (progress.location as GameLocation) || 'town';
  const activeScreen: 'town' | 'store' | 'cave' | 'battle' = battle
    ? 'battle'
    : location;

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
    setMessage('Entras a la cueva y escuchas ruidos extraños.');
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
    setBattle(null);
    setLocation('town');
    setMessage('Huiste del combate.');
  }

  async function restart() {
    await progressState.reset();
    setBattle(null);
    setMessage('Partida reiniciada. Estas en la plaza del pueblo.');
  }

  function renderCurrentScreen() {
    if (progress.wonDragon || progress.gameOver) {
      return (
        <Pressable style={styles.button} onPress={restart}>
          <Text style={styles.buttonText}>Jugar de nuevo</Text>
        </Pressable>
      );
    }

    if (activeScreen === 'battle' && battle) {
      return (
        <BattleScreen
          monster={monsters[battle.monsterIndex]}
          monsterHealth={battle.monsterHealth}
          onAttack={attack}
          onDodge={dodge}
          onFlee={flee}
        />
      );
    }

    if (activeScreen === 'town') {
      return (
        <TownScreen
          onGoStore={goStore}
          onGoCave={goCave}
          onFightDragon={() => fightMonster(2)}
        />
      );
    }

    if (activeScreen === 'store') {
      return (
        <StoreScreen
          onBuyHealth={buyHealth}
          onBuyWeapon={buyWeapon}
          onGoTown={goTown}
        />
      );
    }

    return (
      <CaveScreen
        onFightBeast={() => fightMonster(0)}
        onFightWalker={() => fightMonster(1)}
        onGoTown={goTown}
      />
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <ActivityIndicator color="#ffffff" />
          <Text style={styles.subtitle}>Cargando progreso...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Juego de Rol Mobile</Text>
        <Text style={styles.subtitle}>Sesion activa como {user.username}</Text>

        <View style={styles.card}>
          <Text style={styles.stat}>XP: {progress.xp}</Text>
          <Text style={styles.stat}>Vida: {progress.health}</Text>
          <Text style={styles.stat}>Oro: {progress.gold}</Text>
          <Text style={styles.stat}>Arma actual: {currentWeapon.name}</Text>
          <Text style={styles.stat}>Pantalla: {activeScreen}</Text>
          <Text style={styles.stat}>Ubicacion: {progress.location}</Text>
          <Text style={styles.stat}>Inventario: {progress.inventory.join(', ')}</Text>
        </View>

        <Text style={styles.message}>{message}</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {renderCurrentScreen()}

        <Pressable
          style={[styles.button, saving && styles.buttonDisabled]}
          disabled={saving}
          onPress={progressState.save}>
          <Text style={styles.buttonText}>
            {saving ? 'Guardando...' : 'Guardar progreso'}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.secondaryButton, saving && styles.buttonDisabled]}
          disabled={saving}
          onPress={restart}>
          <Text style={styles.buttonText}>Reiniciar progreso</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.secondaryButton, saving && styles.buttonDisabled]}
          disabled={saving}
          onPress={progressState.reload}>
          <Text style={styles.buttonText}>Recargar progreso</Text>
        </Pressable>

        <Pressable style={[styles.button, styles.logoutButton]} onPress={onLogout}>
          <Text style={styles.buttonText}>Cerrar sesion</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  container: {
    paddingVertical: 24,
    padding: 24,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    color: '#c9d1d9',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  stat: {
    color: '#e6edf3',
    fontSize: 15,
    marginBottom: 4,
  },
  error: {
    color: '#ff7b72',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    color: '#f0f6fc',
    textAlign: 'center',
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
    backgroundColor: '#1f6feb',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#8957e5',
  },
  logoutButton: {
    backgroundColor: '#30363d',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    textAlign: 'center',
  },
});
