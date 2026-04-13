import {useCallback, useMemo, useState} from 'react';
import {login, me, register} from '../services/auth';
import type {AuthUser} from './types';

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
};

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    loading: false,
    error: null,
  });

  const clearError = useCallback(() => {
    setState(prev => ({...prev, error: null}));
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    setState(prev => ({...prev, loading: true, error: null}));
    try {
      const data = await login(username.trim(), password);
      const currentUser = await me(data.token);
      setState({
        token: data.token,
        user: currentUser,
        loading: false,
        error: null,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo iniciar sesión.';
      setState(prev => ({
        ...prev,
        loading: false,
        error: message,
      }));
    }
  }, []);

  const signUp = useCallback(async (username: string, password: string) => {
    setState(prev => ({...prev, loading: true, error: null}));
    try {
      await register(username.trim(), password);
      const data = await login(username.trim(), password);
      const currentUser = await me(data.token);
      setState({
        token: data.token,
        user: currentUser,
        loading: false,
        error: null,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo crear la cuenta.';
      setState(prev => ({
        ...prev,
        loading: false,
        error: message,
      }));
    }
  }, []);

  const signOut = useCallback(() => {
    setState({
      token: null,
      user: null,
      loading: false,
      error: null,
    });
  }, []);

  return useMemo(
    () => ({
      token: state.token,
      user: state.user,
      loading: state.loading,
      error: state.error,
      clearError,
      signIn,
      signUp,
      signOut,
      isAuthenticated: !!state.token && !!state.user,
    }),
    [clearError, signIn, signOut, signUp, state],
  );
}
