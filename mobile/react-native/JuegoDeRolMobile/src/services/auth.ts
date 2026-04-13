import {apiRequest} from './api';
import type {AuthUser} from '../state/types';

type LoginResponse = {
  token: string;
  user: AuthUser;
};

type MeResponse = {
  user: AuthUser;
};

export async function register(
  username: string,
  password: string,
): Promise<void> {
  await apiRequest<{user: AuthUser}>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({username, password}),
  });
}

export async function login(
  username: string,
  password: string,
): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({username, password}),
  });
}

export async function me(token: string): Promise<AuthUser> {
  const data = await apiRequest<MeResponse>('/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data.user;
}
