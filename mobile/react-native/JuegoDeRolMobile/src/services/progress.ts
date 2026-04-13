import {apiRequest} from './api';
import type {PlayerProgress} from '../state/types';

type ProgressResponse = {
  progress: PlayerProgress;
};

type OkResponse = {
  ok: boolean;
};

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function getProgress(token: string): Promise<PlayerProgress> {
  const data = await apiRequest<ProgressResponse>('/progress', {
    method: 'GET',
    headers: authHeaders(token),
  });
  return data.progress;
}

export async function putProgress(
  token: string,
  progress: PlayerProgress,
): Promise<void> {
  await apiRequest<OkResponse>('/progress', {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(progress),
  });
}

export async function resetProgress(token: string): Promise<PlayerProgress> {
  await apiRequest<OkResponse>('/progress/reset', {
    method: 'POST',
    headers: authHeaders(token),
  });
  return getProgress(token);
}
