import React, {useEffect, useState} from 'react';
import {ActivityIndicator, StatusBar, StyleSheet, Text, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import AuthScreen from './src/screens/AuthScreen';
import GameNavigator from './src/navigation/GameNavigator';
import {useAuth} from './src/state/useAuth';
import {preloadGameImages} from './src/assets/gameImages';

function App(): React.JSX.Element {
  const auth = useAuth();
  const [imagesReady, setImagesReady] = useState(false);

  useEffect(() => {
    preloadGameImages()
      .catch(() => {
        // If preload fails, continue boot with bundled assets.
      })
      .finally(() => {
        setImagesReady(true);
      });
  }, []);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#060b14" />
      {!imagesReady ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#ffffff" />
          <Text style={styles.loadingText}>Cargando recursos...</Text>
        </View>
      ) : auth.isAuthenticated && auth.user && auth.token ? (
        <NavigationContainer>
          <GameNavigator token={auth.token} user={auth.user} onLogout={auth.signOut} />
        </NavigationContainer>
      ) : (
        <AuthScreen
          loading={auth.loading}
          error={auth.error}
          onClearError={auth.clearError}
          onLogin={auth.signIn}
          onRegister={auth.signUp}
        />
      )}
    </>
  );
}

export default App;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#060b14',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 15,
  },
});
