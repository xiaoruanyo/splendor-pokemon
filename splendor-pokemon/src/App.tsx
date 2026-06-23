import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from './store/gameStore';
import HomeScreen from './components/HomeScreen';
import GameScreen from './components/GameScreen';
import LoginScreen from './components/LoginScreen';
import LobbyScreen from './components/LobbyScreen';
import OnlineGameScreen from './components/OnlineGameScreen';
import { isLoggedIn, auth } from './network/api';

type Screen = 'home' | 'login' | 'lobby' | 'game' | 'online_game';

export default function App() {
  const game = useGameStore(s => s.game);
  const gameId = useGameStore(s => s.game?.gameId);
  const isAIThinking = useGameStore(s => s.isAIThinking);
  const gameOver = useGameStore(s => s.gameOver);
  const evolutionOptions = useGameStore(s => s.evolutionOptions);
  const currentPlayerIndex = useGameStore(s => s.game?.currentPlayerIndex);
  const turnNumber = useGameStore(s => s.game?.turnNumber);
  const phase = useGameStore(s => s.game?.phase);

  const [screen, setScreen] = useState<Screen>('home');
  const [user, setUser] = useState<{ id: string; username: string; avatar: string } | null>(null);
  const [onlineGameState, setOnlineGameState] = useState<any>(null);
  const [, setLoading] = useState(false);

  // Try to restore session on mount
  useEffect(() => {
    if (isLoggedIn() && !user) {
      setLoading(true);
      auth.me().then(data => {
        setUser({ id: data.id, username: data.username, avatar: data.avatar });
      }).catch(() => {
        // Token expired or invalid
      }).finally(() => setLoading(false));
    }
  }, []);

  // Navigate to game when solo/local game starts
  useEffect(() => {
    if (gameId && phase !== 'finished') {
      setScreen('game');
    }
  }, [gameId]);

  // Auto-trigger AI turns (for solo/local mode)
  useEffect(() => {
    if (!game || isAIThinking || gameOver || phase === 'finished') return;
    if (screen !== 'game') return;
    const currentPlayer = game.players[currentPlayerIndex!];
    if (currentPlayer?.isAI && evolutionOptions.length === 0) {
      const timer = setTimeout(() => {
        useGameStore.getState().triggerAITurn();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentPlayerIndex, turnNumber, isAIThinking, gameOver, evolutionOptions.length, screen]);

  // Auto-end AI evolution phase
  useEffect(() => {
    if (!game || isAIThinking || gameOver || phase === 'finished') return;
    if (screen !== 'game') return;
    const currentPlayer = game.players[currentPlayerIndex!];
    if (currentPlayer?.isAI && evolutionOptions.length > 0) {
      const timer = setTimeout(() => {
        useGameStore.getState().triggerAITurn();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [evolutionOptions.length, currentPlayerIndex, screen]);

  // Handle login
  const handleLogin = useCallback((loggedInUser: { id: string; username: string; avatar: string }) => {
    setUser(loggedInUser);
    setScreen('lobby');
  }, []);

  // Handle avatar change
  const handleAvatarChange = useCallback((newAvatar: string) => {
    setUser(prev => prev ? { ...prev, avatar: newAvatar } : null);
  }, []);

  // Handle logout
  const handleLogout = useCallback(() => {
    setUser(null);
    setScreen('home');
  }, []);

  // Handle online game start
  const handleOnlineGameStart = useCallback((gameState: any) => {
    setOnlineGameState(gameState);
    setScreen('online_game');
  }, []);

  // Handle back from game screens
  const handleBackFromGame = useCallback(() => {
    useGameStore.setState({
      game: null, selectedTokens: [], selectedCard: null, actionMode: 'none',
      evolutionOptions: [], evolutionTarget: null, message: null, messageType: 'info',
      isAIThinking: false, gameOver: false,
    });
    setOnlineGameState(null);
    setScreen('home');
  }, []);

  const handleBackFromOnlineGame = useCallback(() => {
    setOnlineGameState(null);
    setScreen('lobby');
  }, []);

  return (
    <div className="min-h-screen bg-poke-dark">
      {screen === 'home' && (
        <HomeScreen
          onStartSolo={() => setScreen('game')}
          onEnterOnline={async () => {
            if (isLoggedIn()) {
              try {
                const data = await auth.me();
                setUser({ id: data.id, username: data.username, avatar: data.avatar });
                setScreen('lobby');
              } catch {
                setScreen('login');
              }
            } else {
              setScreen('login');
            }
          }}
        />
      )}
      {screen === 'login' && (
        <LoginScreen
          onLogin={handleLogin}
          onBack={() => setScreen('home')}
        />
      )}
      {screen === 'lobby' && user && (
        <LobbyScreen
          user={user}
          onStartGame={handleOnlineGameStart}
          onLogout={handleLogout}
          onBackToSolo={() => setScreen('home')}
          onAvatarChange={handleAvatarChange}
        />
      )}
      {screen === 'game' && game && (
        <GameScreen onBack={handleBackFromGame} />
      )}
      {screen === 'online_game' && onlineGameState && (
        <OnlineGameScreen
          initialGameState={onlineGameState}
          onBackToLobby={handleBackFromOnlineGame}
        />
      )}
    </div>
  );
}
