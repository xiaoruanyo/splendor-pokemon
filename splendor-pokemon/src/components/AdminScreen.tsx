import { useState, useEffect } from 'react';
import { admin } from '../network/api';

const ADMIN_TOKEN_KEY = 'admin_token';

interface CodeEntry {
  id: string;
  code: string;
  isUsed: boolean;
  usedBy: string | null;
  usedAt: string | null;
  createdAt: string;
}

interface CodesData {
  codes: CodeEntry[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  stats: { total: number; totalUsed: number; totalUnused: number };
}

export default function AdminScreen({ onBack }: { onBack: () => void }) {
  const [adminToken, setAdminToken] = useState<string | null>(
    () => localStorage.getItem(ADMIN_TOKEN_KEY)
  );
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Generate state
  const [genCount, setGenCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [newCodes, setNewCodes] = useState<string[]>([]);
  const [genError, setGenError] = useState('');

  // View codes state
  const [codesData, setCodesData] = useState<CodesData | null>(null);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [codeFilter, setCodeFilter] = useState<string>('');
  const [codePage, setCodePage] = useState(1);
  const [copiedAll, setCopiedAll] = useState(false);

  // Auto-load codes on login
  useEffect(() => {
    if (adminToken) loadCodes();
  }, [adminToken, codeFilter, codePage]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const result = await admin.login(password);
      localStorage.setItem(ADMIN_TOKEN_KEY, result.token);
      setAdminToken(result.token);
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setAdminToken(null);
    setCodesData(null);
    setNewCodes([]);
  };

  const handleGenerate = async () => {
    if (!adminToken) return;
    setGenError('');
    setGenerating(true);
    setCopiedAll(false);
    try {
      const result = await admin.generateCodes(genCount, adminToken);
      setNewCodes(result.codes);
      loadCodes(); // refresh list
    } catch (err: any) {
      setGenError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const loadCodes = async () => {
    if (!adminToken) return;
    setLoadingCodes(true);
    try {
      const data = await admin.getCodes(adminToken, {
        page: codePage,
        filter: codeFilter || undefined,
      });
      setCodesData(data);
    } catch {
      // Token expired
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      setAdminToken(null);
    } finally {
      setLoadingCodes(false);
    }
  };

  const copyAllCodes = () => {
    navigator.clipboard.writeText(newCodes.join('\n'));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const formatDate = (d: string | null) => {
    if (!d) return '-';
    return new Date(d).toLocaleString('zh-CN');
  };

  // Login screen
  if (!adminToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-950">
        <div className="w-full max-w-sm bg-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-700">
          <div className="text-center mb-6">
            <span className="text-4xl">🔑</span>
            <h1 className="text-white font-extrabold text-xl mt-2">管理后台</h1>
            <p className="text-gray-500 text-sm mt-1">请输入管理员密码</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="管理员密码"
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-poke-gold"
              autoFocus
            />
            {loginError && (
              <div className="bg-red-600/20 border border-red-500/30 rounded-lg px-3 py-2 text-sm text-red-300">
                {loginError}
              </div>
            )}
            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3 rounded-xl bg-poke-gold text-poke-dark font-extrabold hover:bg-yellow-500 disabled:opacity-50 transition-all"
            >
              {loggingIn ? '验证中...' : '登录'}
            </button>
          </form>

          <button onClick={onBack} className="w-full mt-4 py-2 text-gray-500 hover:text-gray-300 text-sm transition-colors">
            ← 返回
          </button>
        </div>
      </div>
    );
  }

  // Admin panel
  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-white font-extrabold text-xl">🔑 管理后台</h1>
            <span className="text-xs text-gray-500">邀请码管理</span>
          </div>
          <div className="flex gap-2">
            <button onClick={handleLogout} className="px-4 py-2 rounded-xl bg-gray-800 text-gray-400 text-sm hover:bg-gray-700 transition-all">
              退出登录
            </button>
            <button onClick={onBack} className="px-4 py-2 rounded-xl bg-gray-700 text-white text-sm hover:bg-gray-600 transition-all">
              ← 返回
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Generate codes */}
          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-700">
            <h2 className="text-white font-bold mb-4">🎫 生成邀请码</h2>
            <div className="flex gap-3 mb-3">
              <input
                type="number"
                value={genCount}
                onChange={e => setGenCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                min={1}
                max={100}
                className="w-24 bg-gray-800 text-white rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-poke-gold text-center"
              />
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex-1 py-2 rounded-xl bg-poke-gold text-poke-dark font-bold text-sm hover:bg-yellow-500 disabled:opacity-50 transition-all"
              >
                {generating ? '生成中...' : `生成 ${genCount} 个`}
              </button>
            </div>
            {genError && (
              <div className="bg-red-600/20 border border-red-500/30 rounded-lg px-3 py-2 text-sm text-red-300 mb-3">
                {genError}
              </div>
            )}
            {newCodes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">已生成 {newCodes.length} 个邀请码：</span>
                  <button
                    onClick={copyAllCodes}
                    className="text-xs text-poke-gold hover:text-yellow-400 transition-all"
                  >
                    {copiedAll ? '✓ 已复制' : '📋 一键复制全部'}
                  </button>
                </div>
                <div className="bg-gray-800 rounded-xl p-3 max-h-48 overflow-y-auto space-y-1">
                  {newCodes.map((code, i) => (
                    <div
                      key={i}
                      onClick={() => copyCode(code)}
                      className="text-sm text-green-400 font-mono cursor-pointer hover:bg-gray-700 px-2 py-1 rounded transition-all flex items-center justify-between group"
                      title="点击复制"
                    >
                      <span>{code}</span>
                      <span className="text-gray-600 text-xs opacity-0 group-hover:opacity-100">复制</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Stats */}
          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-700">
            <h2 className="text-white font-bold mb-4">📊 统计</h2>
            {codesData ? (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-extrabold text-white">{codesData.stats.total}</div>
                  <div className="text-xs text-gray-400 mt-1">总计</div>
                </div>
                <div className="bg-green-900/30 rounded-xl p-4 text-center border border-green-700/30">
                  <div className="text-2xl font-extrabold text-green-400">{codesData.stats.totalUnused}</div>
                  <div className="text-xs text-gray-400 mt-1">可用</div>
                </div>
                <div className="bg-gray-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-extrabold text-gray-300">{codesData.stats.totalUsed}</div>
                  <div className="text-xs text-gray-400 mt-1">已使用</div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-sm text-center py-8">加载中...</div>
            )}
          </div>
        </div>

        {/* Code list */}
        <div className="mt-4 bg-gray-900 rounded-2xl p-5 border border-gray-700">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-white font-bold">📋 邀请码列表</h2>
            <div className="flex gap-2">
              {['', 'unused', 'used'].map(f => (
                <button
                  key={f}
                  onClick={() => { setCodeFilter(f); setCodePage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    codeFilter === f ? 'bg-poke-gold text-poke-dark' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {f === '' ? '全部' : f === 'unused' ? '可用' : '已使用'}
                </button>
              ))}
            </div>
          </div>

          {loadingCodes ? (
            <div className="text-gray-500 text-sm text-center py-8 animate-pulse">加载中...</div>
          ) : codesData && codesData.codes.length === 0 ? (
            <div className="text-gray-500 text-sm text-center py-8">暂无数据</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 text-xs border-b border-gray-800">
                      <th className="text-left py-2 px-2 font-medium">邀请码</th>
                      <th className="text-center py-2 px-2 font-medium">状态</th>
                      <th className="text-left py-2 px-2 font-medium">使用者</th>
                      <th className="text-left py-2 px-2 font-medium hidden md:table-cell">使用时间</th>
                      <th className="text-left py-2 px-2 font-medium hidden md:table-cell">创建时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {codesData!.codes.map(c => (
                      <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                        <td className="py-2 px-2">
                          <span
                            className="font-mono text-green-400 cursor-pointer hover:text-green-300"
                            onClick={() => copyCode(c.code)}
                            title="点击复制"
                          >
                            {c.code}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center">
                          {c.isUsed ? (
                            <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-lg">已使用</span>
                          ) : (
                            <span className="text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded-lg">可用</span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-gray-300">{c.usedBy || '-'}</td>
                        <td className="py-2 px-2 text-gray-500 text-xs hidden md:table-cell">{formatDate(c.usedAt)}</td>
                        <td className="py-2 px-2 text-gray-500 text-xs hidden md:table-cell">{formatDate(c.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {codesData && codesData.pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button
                    onClick={() => setCodePage(p => Math.max(1, p - 1))}
                    disabled={codePage <= 1}
                    className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 text-xs hover:bg-gray-700 disabled:opacity-30 transition-all"
                  >
                    ← 上一页
                  </button>
                  <span className="text-xs text-gray-500">
                    {codesData.pagination.page} / {codesData.pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setCodePage(p => Math.min(codesData.pagination.totalPages, p + 1))}
                    disabled={codePage >= codesData.pagination.totalPages}
                    className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 text-xs hover:bg-gray-700 disabled:opacity-30 transition-all"
                  >
                    下一页 →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
