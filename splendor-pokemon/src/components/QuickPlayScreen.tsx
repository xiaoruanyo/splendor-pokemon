import { useEffect, useState } from 'react';
import { connectGuestSocket, disconnectSocket, getSocket } from '../network/socket';
import type { GameState } from '../types/game';
import TrainerAvatar from './TrainerAvatar';

const avatars = [{id:'forest',name:'森林探索家'},{id:'ocean',name:'海洋冒险家'},{id:'flame',name:'火焰挑战者'},{id:'electric',name:'闪电追逐者'},{id:'moon',name:'月夜旅人'},{id:'rock',name:'山岳攀登者'},{id:'ice',name:'冰原行者'},{id:'flower',name:'花园伙伴'}];
interface Room {
  roomId: string; hostId: string;
  players: {id:string;name:string;avatar:string;ready:boolean}[];
}
interface Reply { error?: string; room?: Room }

export default function QuickPlayScreen({ onBack, onStartGame }: {onBack:()=>void;onStartGame:(game:GameState)=>void}) {
  const [name,setName] = useState(() => localStorage.getItem('quick-name') || '');
  const [avatar,setAvatar] = useState('forest');
  const [code,setCode] = useState('');
  const [room,setRoom] = useState<Room|null>(null);
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState('');
  const [socket,setSocket] = useState<ReturnType<typeof getSocket>>(null);
  useEffect(() => {
    // Returning after a match starts a fresh room, without touching account login.
    disconnectSocket();
  }, []);
  useEffect(() => {
    if (!socket) return;
    const disconnected = () => {setRoom(null);setBusy(false);setError('连接已断开，请重新创建或加入房间');};
    const failed = (e:Error) => {setError(e.message);setBusy(false);};
    socket.on('room:updated',setRoom);
    socket.on('game:started',onStartGame);
    socket.on('disconnect',disconnected);
    socket.on('connect_error',failed);
    return () => {
      socket.off('room:updated',setRoom);socket.off('game:started',onStartGame);
      socket.off('disconnect',disconnected);socket.off('connect_error',failed);
    };
  },[socket,onStartGame]);
  const enter = (create:boolean) => {
    if (!name.trim() || name.trim().length > 16) {setError('请输入 1–16 字昵称');return;}
    if (!create && !/^\d{6}$/.test(code.trim())) {setError('请输入六位房间码');return;}
    setBusy(true);setError('');setNotice('');
    localStorage.setItem('quick-name',name.trim());
    const s=connectGuestSocket({name:name.trim(),avatar});setSocket(s);
    s.once('connect',()=>s.timeout(8000).emit(create?'room:create':'room:join',create?{maxPlayers:4}:{roomId:code.trim()},(err:Error|null,res:Reply)=>{
      setBusy(false);
      if(err || res?.error) {setError(res?.error || '服务暂时没有响应，请重试');return;}
      if(res.room)setRoom(res.room);
    }));
  };
  const exit = () => {getSocket()?.emit('room:leave');disconnectSocket();onBack();};
  const start = () => {
    setBusy(true);setError('');
    socket?.timeout(8000).emit('game:start',{},(err:Error|null,res:Reply)=>{
      setBusy(false);if(err || res?.error)setError(res?.error || '开始失败，请重试');
    });
  };
  const me=room?.players.find(p=>p.id===socket?.id);
  return <main className="quick-page">
    <button className="quick-back" onClick={exit}>← 返回首页</button>
    <section className="quick-panel">
      <div className="home-eyebrow">PLAY TOGETHER</div>
      <h1>{room?'训练家集合':'下一场冒险，从你开始'}</h1>
      <p className="quick-subtitle">{room?'把房间码发给朋友，准备好就出发。':'无需注册 · 选择头像和昵称，和朋友一起玩'}</p>
      {error && <p role="alert" className="quick-error">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {!room ? <>
        <div className="avatar-options" role="group" aria-label="选择训练家头像">
          {avatars.map(a=><button key={a.id} aria-pressed={avatar===a.id} disabled={busy} onClick={()=>setAvatar(a.id)}>
            <img src={`/assets/trainers/${a.id}.webp`} alt=""/><span>{a.name}</span>
          </button>)}
        </div>
        <label className="quick-label">你的昵称<input value={name} maxLength={16} disabled={busy} onChange={e=>setName(e.target.value)} placeholder="朋友们怎么称呼你？" autoComplete="nickname"/></label>
        <div className="quick-join"><label className="quick-label">房间码<input value={code} maxLength={6} disabled={busy} onChange={e=>setCode(e.target.value.replace(/\D/g,''))} placeholder="六位数字" inputMode="numeric" onKeyDown={e=>{if(e.key==='Enter'&&!busy)enter(false);}}/></label>
          <button disabled={busy} onClick={()=>enter(false)}>加入房间</button></div>
        <div className="quick-divider">或者邀请朋友来玩</div>
        <button className="quick-create" disabled={busy} onClick={()=>enter(true)}>{busy?'正在连接…':'创建新房间 · 2–4 人'}</button>
      </> : <>
        <button className="room-code" title="复制房间码" onClick={()=>navigator.clipboard.writeText(room.roomId).then(()=>setNotice('房间码已复制')).catch(()=>setNotice('请手动复制下方房间码'))}><small>房间码 · 点击复制</small><strong>{room.roomId}</strong></button>
        <div className="quick-players">{room.players.map(p=><div key={p.id}><TrainerAvatar avatar={p.avatar}/><strong>{p.name}</strong><span>{p.id===room.hostId?'房主':p.ready?'已准备':'等待准备'}</span></div>)}</div>
        {socket?.id===room.hostId?<button className="quick-create" disabled={busy||room.players.length<2||!room.players.every(p=>p.ready)} onClick={start}>开始游戏</button>:<button className="quick-create" onClick={()=>socket?.emit('room:ready',!me?.ready)}>{me?.ready?'取消准备':'准备好了'}</button>}
        <button className="quick-back" onClick={()=>{socket?.emit('room:leave');setRoom(null);setNotice('');}}>离开房间</button>
      </>}
    </section>
  </main>;
}
