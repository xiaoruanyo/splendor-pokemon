import { useState } from 'react';
import { auth, setToken } from '../network/api';
import { UI_ASSETS } from '../types/game';

interface LoginScreenProps {
  onLogin: (user: { id: string; username: string; avatar: string }) => void;
  onBack: () => void;
}

export default function LoginScreen({ onLogin, onBack }: LoginScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      if (mode === 'login') {
        result = await auth.login(username, password);
      } else {
        result = await auth.register(username, password, activationCode);
      }
      setToken(result.token);
      onLogin(result.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{
      background: `linear-gradient(rgba(10,10,30,0.35), rgba(10,10,30,0.50)), url(${UI_ASSETS.homeBg}) center/cover no-repeat`,
    }}>
      <div className="text-center mb-6">
        <img src={UI_ASSETS.logo} alt="璀璨宝石：宝可梦" className="h-12 mx-auto mb-3 drop-shadow-lg" />
        <p className="text-gray-400 text-sm">在线对战平台</p>
      </div>

      <div className="w-full max-w-sm bg-gray-800/60 rounded-2xl p-6 shadow-xl">
        {/* Mode tabs */}
        <div className="flex mb-6 bg-gray-700/50 rounded-lg p-1">
          <button
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${
              mode === 'login' ? 'bg-poke-gold text-poke-dark' : 'text-gray-400'
            }`}
          >
            登录
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${
              mode === 'register' ? 'bg-poke-gold text-poke-dark' : 'text-gray-400'
            }`}
          >
            注册
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-poke-gold"
              placeholder="输入用户名"
              required
              minLength={2}
              maxLength={20}
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-poke-gold"
              placeholder="输入密码"
              required
              minLength={6}
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="text-xs text-gray-400 block mb-1">激活码</label>
              <input
                type="text"
                value={activationCode}
                onChange={e => setActivationCode(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-poke-gold font-mono tracking-wider"
                placeholder="XXXX-XXXX-XXXX-XXXX"
                required
              />
              <p className="text-xs text-gray-500 mt-1">需要有效的激活码才能注册</p>
            </div>
          )}

          {error && (
            <div className="bg-red-600/20 border border-red-500/30 rounded-lg px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-poke-gold text-poke-dark font-extrabold text-sm hover:bg-yellow-500 disabled:opacity-50 transition-all"
          >
            {loading ? '加载中...' : mode === 'login' ? '登录' : '注册'}
          </button>
        </form>
      </div>

      <button onClick={onBack} className="mt-6 text-gray-500 hover:text-gray-300 text-sm transition-colors">
        ← 返回首页
      </button>
    </div>
  );
}
