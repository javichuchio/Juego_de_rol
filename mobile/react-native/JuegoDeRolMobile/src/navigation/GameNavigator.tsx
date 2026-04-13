import React, {useEffect} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {Alert, BackHandler} from 'react-native';
import type {AuthUser} from '../state/types';
import {GameSessionProvider, useGameSession} from '../state/GameSessionContext';
import GameFrame from '../screens/game/GameFrame';
import TownScreen from '../screens/game/TownScreen';
import StoreScreen from '../screens/game/StoreScreen';
import CaveScreen from '../screens/game/CaveScreen';
import BattleScreen from '../screens/game/BattleScreen';
import {monsters} from '../state/gameData';

export type GameStackParamList = {
  Town: undefined;
  Store: undefined;
  Cave: undefined;
  Battle: undefined;
};

const Stack = createNativeStackNavigator<GameStackParamList>();

type NavigatorProps = {
  token: string;
  user: AuthUser;
  onLogout: () => void;
};

function TownView({
  navigation,
}: NativeStackScreenProps<GameStackParamList, 'Town'>): React.JSX.Element {
  const game = useGameSession();

  useFocusEffect(
    React.useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        Alert.alert(
          'Salir de la app',
          'Estas en la pantalla principal. Quieres salir?',
          [
            {text: 'Cancelar', style: 'cancel'},
            {
              text: 'Salir',
              style: 'destructive',
              onPress: () => BackHandler.exitApp(),
            },
          ],
        );
        return true;
      });

      return () => subscription.remove();
    }, []),
  );

  return (
    <GameFrame screenName="Town">
      <TownScreen
        onGoStore={() => {
          game.goStore();
          navigation.navigate('Store');
        }}
        onGoCave={() => {
          game.goCave();
          navigation.navigate('Cave');
        }}
        onFightDragon={() => {
          game.fightMonster(2);
          navigation.navigate('Battle');
        }}
      />
    </GameFrame>
  );
}

function StoreView({
  navigation,
}: NativeStackScreenProps<GameStackParamList, 'Store'>): React.JSX.Element {
  const game = useGameSession();

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', event => {
      const actionType = event.data.action.type;
      if (actionType === 'GO_BACK' || actionType === 'POP') {
        game.goTown();
      }
    });
    return unsubscribe;
  }, [navigation, game]);

  useFocusEffect(
    React.useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        game.goTown();
        navigation.goBack();
        return true;
      });
      return () => subscription.remove();
    }, [navigation, game]),
  );

  return (
    <GameFrame screenName="Store">
      <StoreScreen
        onBuyHealth={game.buyHealth}
        onBuyWeapon={game.buyWeapon}
        onGoTown={() => {
          game.goTown();
          navigation.navigate('Town');
        }}
      />
    </GameFrame>
  );
}

function CaveView({
  navigation,
}: NativeStackScreenProps<GameStackParamList, 'Cave'>): React.JSX.Element {
  const game = useGameSession();

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', event => {
      const actionType = event.data.action.type;
      if (actionType === 'GO_BACK' || actionType === 'POP') {
        game.goTown();
      }
    });
    return unsubscribe;
  }, [navigation, game]);

  useFocusEffect(
    React.useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        game.goTown();
        navigation.goBack();
        return true;
      });
      return () => subscription.remove();
    }, [navigation, game]),
  );

  return (
    <GameFrame screenName="Cave">
      <CaveScreen
        onFightBeast={() => {
          game.fightMonster(0);
          navigation.navigate('Battle');
        }}
        onFightWalker={() => {
          game.fightMonster(1);
          navigation.navigate('Battle');
        }}
        onGoTown={() => {
          game.goTown();
          navigation.navigate('Town');
        }}
      />
    </GameFrame>
  );
}

function BattleView({
  navigation,
}: NativeStackScreenProps<GameStackParamList, 'Battle'>): React.JSX.Element {
  const game = useGameSession();

  useFocusEffect(
    React.useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        Alert.alert(
          'Combate en curso',
          'No puedes retroceder durante combate. Usa "Huir" o termina la batalla.',
          [{text: 'Entendido'}],
        );
        return true;
      });
      return () => subscription.remove();
    }, []),
  );

  useEffect(() => {
    if (!game.battle) {
      navigation.navigate('Town');
    }
  }, [game.battle, navigation]);

  if (!game.battle) {
    return (
      <GameFrame screenName="Battle">
        <TownScreen
          onGoStore={() => {
            game.goStore();
            navigation.navigate('Store');
          }}
          onGoCave={() => {
            game.goCave();
            navigation.navigate('Cave');
          }}
          onFightDragon={() => {
            game.fightMonster(2);
            navigation.navigate('Battle');
          }}
        />
      </GameFrame>
    );
  }

  return (
    <GameFrame screenName="Battle">
      <BattleScreen
        monster={monsters[game.battle.monsterIndex]}
        monsterHealth={game.battle.monsterHealth}
        onAttack={game.attack}
        onDodge={game.dodge}
        onFlee={() => {
          const escaped = game.flee();
          if (escaped) {
            navigation.navigate('Town');
          }
        }}
      />
    </GameFrame>
  );
}

export default function GameNavigator({
  token,
  user,
  onLogout,
}: NavigatorProps): React.JSX.Element {
  return (
    <GameSessionProvider token={token} user={user} onLogout={onLogout}>
      <Stack.Navigator
        initialRouteName="Town"
        screenOptions={{
          headerShown: false,
          contentStyle: {backgroundColor: '#060b14'},
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="Town" component={TownView} />
        <Stack.Screen name="Store" component={StoreView} />
        <Stack.Screen name="Cave" component={CaveView} />
        <Stack.Screen
          name="Battle"
          component={BattleView}
          options={{headerBackVisible: false, gestureEnabled: false}}
        />
      </Stack.Navigator>
    </GameSessionProvider>
  );
}
