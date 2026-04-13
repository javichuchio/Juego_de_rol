import {useCallback, useEffect, useMemo, useState} from 'react';
import {getProgress, putProgress, resetProgress} from '../services/progress';
import type {PlayerProgress} from './types';

const DEFAULT_PROGRESS: PlayerProgress = {
  xp: 0,
  health: 100,
  gold: 50,
  currentWeaponIndex: 0,
  inventory: ['palo'],
  location: 'town',
  wonDragon: false,
  gameOver: false,
};

type ProgressState = {
  progress: PlayerProgress;
  loading: boolean;
  saving: boolean;
  error: string | null;
};

export function useProgress(token: string) {
  const [state, setState] = useState<ProgressState>({
    progress: DEFAULT_PROGRESS,
    loading: true,
    saving: false,
    error: null,
  });

  const reload = useCallback(async () => {
    setState(prev => ({...prev, loading: true, error: null}));
    try {
      const progress = await getProgress(token);
      setState({
        progress,
        loading: false,
        saving: false,
        error: null,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo cargar progreso.';
      setState(prev => ({
        ...prev,
        loading: false,
        error: message,
      }));
    }
  }, [token]);

  useEffect(() => {
    reload();
  }, [reload]);

  const setLocalProgress = useCallback(
    (next: Partial<PlayerProgress>) => {
      setState(prev => ({
        ...prev,
        progress: {
          ...prev.progress,
          ...next,
        },
      }));
    },
    [],
  );

  const updateProgress = useCallback(
    (updater: (prev: PlayerProgress) => PlayerProgress) => {
      setState(prev => ({
        ...prev,
        progress: updater(prev.progress),
      }));
    },
    [],
  );

  const save = useCallback(async () => {
    setState(prev => ({...prev, saving: true, error: null}));
    try {
      const current = state.progress;
      await putProgress(token, current);
      setState(prev => ({
        ...prev,
        saving: false,
      }));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo guardar progreso.';
      setState(prev => ({
        ...prev,
        saving: false,
        error: message,
      }));
    }
  }, [state.progress, token]);

  const reset = useCallback(async () => {
    setState(prev => ({...prev, saving: true, error: null}));
    try {
      const progress = await resetProgress(token);
      setState(prev => ({
        ...prev,
        progress,
        saving: false,
      }));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo reiniciar progreso.';
      setState(prev => ({
        ...prev,
        saving: false,
        error: message,
      }));
    }
  }, [token]);

  const clearError = useCallback(() => {
    setState(prev => ({...prev, error: null}));
  }, []);

  return useMemo(
    () => ({
      progress: state.progress,
      loading: state.loading,
      saving: state.saving,
      error: state.error,
      clearError,
      setLocalProgress,
      updateProgress,
      save,
      reload,
      reset,
    }),
    [clearError, reload, save, setLocalProgress, updateProgress, reset, state],
  );
}
