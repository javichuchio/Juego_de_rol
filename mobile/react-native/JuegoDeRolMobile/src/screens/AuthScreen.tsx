import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import {gameImages} from '../assets/gameImages';

type AuthScreenProps = {
  loading: boolean;
  error: string | null;
  onClearError: () => void;
  onLogin: (username: string, password: string) => Promise<void>;
  onRegister: (username: string, password: string) => Promise<void>;
};

export default function AuthScreen({
  loading,
  error,
  onClearError,
  onLogin,
  onRegister,
}: AuthScreenProps): React.JSX.Element {
  const {width} = useWindowDimensions();
  const isTablet = width >= 768;
  const isSmallPhone = width < 380;
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!error) {
      setLocalError(null);
    }
  }, [error]);

  function validate(username: string, password: string): string | null {
    const cleanUsername = username.trim();
    if (cleanUsername.length < 3) {
      return 'Usuario minimo: 3 caracteres.';
    }
    if (password.length < 6) {
      return 'Contrasena minima: 6 caracteres.';
    }
    return null;
  }

  async function handleLogin() {
    const validationError = validate(loginUsername, loginPassword);
    if (validationError) {
      setLocalError(validationError);
      return;
    }
    setLocalMessage(null);
    setLocalError(null);
    await onLogin(loginUsername, loginPassword);
  }

  async function handleRegister() {
    const validationError = validate(registerUsername, registerPassword);
    if (validationError) {
      setLocalError(validationError);
      return;
    }
    setLocalError(null);
    setLocalMessage('Creando cuenta...');
    await onRegister(registerUsername, registerPassword);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={gameImages.town}
        style={styles.background}
        resizeMode="cover">
        <View
          style={[
            styles.container,
            {
              width: Math.min(width - 24, isTablet ? 560 : 430),
              padding: isTablet ? 26 : isSmallPhone ? 16 : 20,
            },
          ]}>
          <Text style={[styles.title, {fontSize: isTablet ? 38 : isSmallPhone ? 26 : 30}]}>
            Dragon Repeller
          </Text>

          {!showRegister ? (
            <View style={styles.authSection}>
              <Text style={styles.sectionTitle}>Iniciar sesion</Text>
              <TextInput
                style={[styles.input, {paddingVertical: isSmallPhone ? 8 : 10}]}
                value={loginUsername}
                placeholder="Usuario"
                placeholderTextColor="#b4bdc8"
                autoCapitalize="none"
                onChangeText={text => {
                  setLoginUsername(text);
                  setLocalMessage(null);
                  if (error) {
                    onClearError();
                  }
                  if (localError) {
                    setLocalError(null);
                  }
                }}
              />
              <TextInput
                style={[styles.input, {paddingVertical: isSmallPhone ? 8 : 10}]}
                value={loginPassword}
                placeholder="Contrasena"
                placeholderTextColor="#b4bdc8"
                secureTextEntry
                onChangeText={text => {
                  setLoginPassword(text);
                  setLocalMessage(null);
                  if (error) {
                    onClearError();
                  }
                  if (localError) {
                    setLocalError(null);
                  }
                }}
              />
              <Pressable
                style={[
                  styles.button,
                  {paddingVertical: isTablet ? 14 : isSmallPhone ? 10 : 12},
                  loading && styles.buttonDisabled,
                ]}
                disabled={loading}
                onPress={handleLogin}>
                {loading ? (
                  <ActivityIndicator color="#0a0a23" />
                ) : (
                  <Text style={styles.buttonText}>Entrar</Text>
                )}
              </Pressable>

              <Pressable
                style={styles.linkButton}
                onPress={() => {
                  setShowRegister(true);
                  setLocalError(null);
                  setLocalMessage(null);
                }}>
                <Text style={styles.linkText}>No tienes cuenta? Registrate</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.authSection}>
              <Text style={styles.sectionTitle}>Registro</Text>
              <TextInput
                style={[styles.input, {paddingVertical: isSmallPhone ? 8 : 10}]}
                value={registerUsername}
                placeholder="Usuario"
                placeholderTextColor="#b4bdc8"
                autoCapitalize="none"
                onChangeText={text => {
                  setRegisterUsername(text);
                  setLocalMessage(null);
                  if (error) {
                    onClearError();
                  }
                  if (localError) {
                    setLocalError(null);
                  }
                }}
              />
              <TextInput
                style={[styles.input, {paddingVertical: isSmallPhone ? 8 : 10}]}
                value={registerPassword}
                placeholder="Contrasena (min. 6)"
                placeholderTextColor="#b4bdc8"
                secureTextEntry
                onChangeText={text => {
                  setRegisterPassword(text);
                  setLocalMessage(null);
                  if (error) {
                    onClearError();
                  }
                  if (localError) {
                    setLocalError(null);
                  }
                }}
              />
              <Pressable
                style={[
                  styles.button,
                  {paddingVertical: isTablet ? 14 : isSmallPhone ? 10 : 12},
                  loading && styles.buttonDisabled,
                ]}
                disabled={loading}
                onPress={handleRegister}>
                {loading ? (
                  <ActivityIndicator color="#0a0a23" />
                ) : (
                  <Text style={styles.buttonText}>Crear cuenta</Text>
                )}
              </Pressable>
              <Pressable
                style={styles.linkButton}
                onPress={() => {
                  setShowRegister(false);
                  setLocalError(null);
                  setLocalMessage('Ahora puedes iniciar sesion');
                }}>
                <Text style={styles.linkText}>Volver a iniciar sesion</Text>
              </Pressable>
            </View>
          )}

          {localError || error ? (
            <Text style={styles.error}>{localError || error}</Text>
          ) : null}
          {localMessage ? <Text style={styles.message}>{localMessage}</Text> : null}
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
    justifyContent: 'center',
  },
  container: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 20,
    gap: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  authSection: {
    gap: 10,
    paddingVertical: 6,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  input: {
    borderWidth: 2,
    borderColor: 'rgba(254, 172, 50, 0.8)',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: '#ffffff',
    backgroundColor: 'rgba(10, 10, 35, 0.9)',
  },
  error: {
    color: '#ffd76f',
    textAlign: 'center',
    fontWeight: '700',
  },
  message: {
    color: '#ffd76f',
    textAlign: 'center',
  },
  button: {
    width: '100%',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#feac32',
    borderColor: '#feac32',
    borderWidth: 2,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#0a0a23',
    fontWeight: '700',
    fontSize: 16,
  },
  linkButton: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  linkText: {
    color: '#ffd76f',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
