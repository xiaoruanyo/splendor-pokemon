const API_BASE = '/api';

export function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request(path: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) throw new Error(data.error || '请求失败');
  return data;
}

// Auth
export const auth = {
  register: (username: string, password: string, activationCode: string, avatar?: string) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, activationCode, avatar }),
    }),
  login: (username: string, password: string) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  me: () => request('/auth/me'),
  getAvatars: () => request('/auth/avatars'),
};

// Users
export const users = {
  getProfile: (id: string) => request(`/users/${id}`),
  getStats: (id: string) => request(`/users/${id}/stats`),
  getLeaderboard: () => request('/users/leaderboard'),
  updateAvatar: (avatar: string) =>
    request('/users/me/avatar', {
      method: 'PUT',
      body: JSON.stringify({ avatar }),
    }),
};

// Admin
export const admin = {
  generateCodes: (count: number) =>
    request('/admin/generate-codes', {
      method: 'POST',
      body: JSON.stringify({ count }),
    }),
};

// Token management
export function setToken(token: string): void {
  localStorage.setItem('token', token);
}

export function clearToken(): void {
  localStorage.removeItem('token');
}

export function isLoggedIn(): boolean {
  return !!getToken();
}
