import React from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {useGameSession} from '../../state/GameSessionContext';
import {gameImages} from '../../assets/gameImages';

type GameFrameProps = {
  screenName: string;
  children: React.ReactNode;
};

export default function GameFrame({
  screenName,
  children,
}: GameFrameProps): React.JSX.Element {
  const game = useGameSession();
  const {width} = useWindowDimensions();
  const isTablet = width >= 768;
  const isNarrow = width < 390;
  const [showSessionTools, setShowSessionTools] = React.useState(false);
  const isBattleScreen = screenName === 'Battle';

  function getBackgroundImage() {
    if (game.battle) {
      if (game.battle.monsterIndex === 0) {
        return gameImages.beast;
      }
      if (game.battle.monsterIndex === 1) {
        return gameImages.walker;
      }
      return gameImages.dragon;
    }
    if (game.progress.location === 'store') {
      return gameImages.store;
    }
    if (game.progress.location === 'cave') {
      return gameImages.cave;
    }
    return gameImages.town;
  }

  function confirmRestart() {
    Alert.alert(
      'Reiniciar progreso',
      'Se perdera tu progreso actual. Quieres continuar?',
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Reiniciar',
          style: 'destructive',
          onPress: () => {
            game.restart().catch(() => {});
          },
        },
      ],
    );
  }

  if (game.loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ImageBackground source={getBackgroundImage()} style={styles.background} resizeMode="cover">
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#ffffff" />
            <Text style={styles.subtitle}>Cargando progreso...</Text>
          </View>
        </ImageBackground>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground source={getBackgroundImage()} style={styles.background} resizeMode="cover">
        <View
          style={[
            styles.panel,
            {
              width: Math.min(width - 20, isTablet ? 760 : 540),
              padding: isTablet ? 18 : isNarrow ? 10 : 14,
            },
          ]}>
          <ScrollView contentContainerStyle={styles.container}>
            <View style={[styles.topActions, isNarrow && styles.topActionsStacked]}>
              <Pressable
                style={[styles.button, styles.topActionButton, isBattleScreen && styles.compactTopButton]}
                onPress={() => setShowSessionTools(prev => !prev)}>
                <Text style={styles.buttonText}>
                  {showSessionTools ? 'Ocultar opciones' : 'Opciones'}
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.button,
                  styles.topActionButton,
                  styles.logoutButton,
                  isBattleScreen && styles.compactTopButton,
                ]}
                onPress={game.onLogout}>
                <Text style={styles.buttonText}>Cerrar sesion</Text>
              </Pressable>
            </View>

            {isBattleScreen ? (
              <View style={[styles.statsCard, styles.statsCardCompact]}>
                <Text style={[styles.stat, styles.compactLine]}>
                  XP: {game.progress.xp}   |   HP: {game.progress.health}   |   Oro: {game.progress.gold}
                </Text>
              </View>
            ) : (
              <View style={styles.statsCard}>
                <Text style={styles.stat}>XP: {game.progress.xp}</Text>
                <Text style={styles.stat}>Health: {game.progress.health}</Text>
                <Text style={styles.stat}>Gold: {game.progress.gold}</Text>
              </View>
            )}

            <View style={[styles.metaCard, isBattleScreen && styles.metaCardCompact]}>
              {!isBattleScreen ? <Text style={styles.metaStat}>Usuario: {game.user.username}</Text> : null}
              <Text style={styles.metaStat}>Arma: {game.currentWeaponName}</Text>
            </View>

            {children}

            <View style={[styles.messageCard, isBattleScreen && styles.messageCardCompact]}>
              <Text style={styles.message}>{game.message}</Text>
            </View>

            {game.error ? <Text style={styles.error}>{game.error}</Text> : null}

            {showSessionTools ? (
              <View style={styles.toolsCard}>
                <Pressable
                  style={[styles.button, styles.compactButton, game.saving && styles.buttonDisabled]}
                  disabled={game.saving}
                  onPress={game.save}>
                  <Text style={styles.buttonText}>
                    {game.saving ? 'Guardando...' : 'Guardar'}
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.button, styles.compactButton, game.saving && styles.buttonDisabled]}
                  disabled={game.saving}
                  onPress={game.reload}>
                  <Text style={styles.buttonText}>Recargar</Text>
                </Pressable>

                <Pressable
                  style={[styles.button, styles.compactButton, game.saving && styles.buttonDisabled]}
                  disabled={game.saving}
                  onPress={confirmRestart}>
                  <Text style={styles.buttonText}>Reiniciar</Text>
                </Pressable>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#060b14',
  },
  background: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  loadingContainer: {
    margin: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  panel: {
    alignSelf: 'center',
    marginHorizontal: 14,
    marginBottom: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 14,
  },
  container: {
    paddingBottom: 6,
    gap: 10,
  },
  topActions: {
    flexDirection: 'row',
    gap: 8,
  },
  topActionsStacked: {
    flexDirection: 'column',
  },
  topActionButton: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 10,
  },
  compactTopButton: {
    paddingVertical: 8,
  },
  subtitle: {
    color: '#ffffff',
    fontSize: 15,
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  statsCardCompact: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  metaCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  metaCardCompact: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 2,
  },
  stat: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  compactLine: {
    fontSize: 14,
  },
  metaStat: {
    color: '#f3f4f6',
    fontSize: 14,
  },
  messageCard: {
    backgroundColor: 'rgba(10, 10, 35, 0.9)',
    borderRadius: 8,
    padding: 15,
  },
  messageCardCompact: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  message: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 21,
  },
  error: {
    color: '#ffd76f',
    textAlign: 'center',
    fontWeight: '700',
  },
  button: {
    width: '100%',
    backgroundColor: '#feac32',
    borderColor: '#feac32',
    borderWidth: 2,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButton: {
    alignSelf: 'auto',
  },
  toolsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  compactButton: {
    paddingVertical: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#0a0a23',
    fontWeight: '700',
    fontSize: 16,
  },
});
