const API_BASE = '/api';

// 预设头像列表（与后端保持一致）
export const PRESET_AVATARS = ['🧢', '💧', '🪨', '🚀', '🎩', '🎀', '👒', '🔥', '⚡', '🌿', '👻'];

export function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request(path: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const explicitHeaders = (options.headers as Record<string, string> || {});
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...explicitHeaders,
  };
  // Only use user token if no Authorization header was explicitly passed
  if (token && !explicitHeaders['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

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

  // 获取个人对战历史
  getHistory: () => request('/users/me/history'),
};

// Admin
export const admin = {
  login: (password: string) =>
    request('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  generateCodes: (count: number, adminToken: string) =>
    request('/admin/generate-codes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ count }),
    }),

  getCodes: (adminToken: string, params?: { page?: number; filter?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.filter) query.set('filter', params.filter);
    const qs = query.toString();
    return request(`/admin/codes${qs ? '?' + qs : ''}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  },
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
