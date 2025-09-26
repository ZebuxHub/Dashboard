import { useState, useEffect } from 'react';
import { 
  CurrencyDollarIcon, 
  SparklesIcon, 
  HeartIcon, 
  GiftIcon,
  ChartBarIcon,
  ClockIcon,
  UserIcon,
  SignalIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useSocket } from '../contexts/SocketContext';
import { useApi } from '../contexts/ApiContext';

interface PlayerData {
  username: string;
  lastUpdate: string;
  gameData: {
    coins: number;
    gems: number;
    pets: number;
    eggs: number;
    mutations?: number;
  };
}

interface ChartData {
  time: string;
  coins: number;
  pets: number;
  gems: number;
}

const Dashboard = () => {
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerData | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [stats, setStats] = useState({
    totalPlayers: 0,
    onlinePlayers: 0,
    totalSyncs: 0,
    avgCoins: 0
  });
  const { socket, isConnected } = useSocket();

  // Load real data from API
  const { apiCall } = useApi();

  const loadDashboardData = async () => {
    try {
      // Load players data
      const playersResponse = await apiCall('/players');
      if (playersResponse.success && playersResponse.players.length > 0) {
        setPlayers(playersResponse.players);
        setSelectedPlayer(playersResponse.players[0]);
      } else {
        // Show empty state if no real data
        setPlayers([]);
        setSelectedPlayer(null);
      }

      // Load stats
      const statsResponse = await apiCall('/admin/stats');
      if (statsResponse.success) {
        setStats({
          totalPlayers: statsResponse.stats.totalUsers || 0,
          onlinePlayers: statsResponse.stats.onlineUsers || 0,
          totalSyncs: statsResponse.stats.totalSyncs || 0,
          avgCoins: 0 // Calculate from players data
        });
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Show empty state on error
      setPlayers([]);
      setSelectedPlayer(null);
      setStats({
        totalPlayers: 0,
        onlinePlayers: 0,
        totalSyncs: 0,
        avgCoins: 0
      });
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Refresh data every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('playerUpdate', (data: PlayerData) => {
      setPlayers(prev => {
        const existing = prev.find(p => p.username === data.username);
        if (existing) {
          return prev.map(p => p.username === data.username ? data : p);
        } else {
          return [...prev, data];
        }
      });
    });

    return () => {
      socket.off('playerUpdate');
    };
  }, [socket]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const StatCard = ({ title, value, icon: Icon, color, change }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    change?: string;
  }) => (
    <div className="glass-card p-6 rounded-xl border border-white/10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {change && (
            <p className="text-sm text-green-400 mt-1">
              +{change} from last hour
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Real-time game data tracking and analytics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-sm text-gray-300">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Players"
          value={stats.totalPlayers}
          icon={UserIcon}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          change="3"
        />
        <StatCard
          title="Online Now"
          value={stats.onlinePlayers}
          icon={SignalIcon}
          color="bg-gradient-to-br from-green-500 to-green-600"
        />
        <StatCard
          title="Total Syncs"
          value={formatNumber(stats.totalSyncs)}
          icon={ChartBarIcon}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          change="127"
        />
        <StatCard
          title="Avg Coins"
          value={formatNumber(stats.avgCoins)}
          icon={CurrencyDollarIcon}
          color="bg-gradient-to-br from-yellow-500 to-yellow-600"
        />
      </div>

      {/* No Data State */}
      {players.length === 0 && (
        <div className="glass-card p-12 rounded-xl border border-white/10 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-6">
            <span className="text-white text-2xl">🎮</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Data Yet</h3>
          <p className="text-gray-400 mb-6">
            No players have synced their data yet. Get started by:
          </p>
          <div className="space-y-3 text-left max-w-md mx-auto">
            <div className="flex items-center space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">1</span>
              <span className="text-gray-300">Generate a token in the Token Generator</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">2</span>
              <span className="text-gray-300">Run the Lua script in Roblox</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">3</span>
              <span className="text-gray-300">Wait for data to sync automatically</span>
            </div>
          </div>
          <div className="mt-6">
            <a href="/token" className="glass-button-enhanced inline-block px-6 py-2 rounded-lg">
              Generate Token
            </a>
          </div>
        </div>
      )}

      {/* Charts and Player List */}
      {players.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 glass-card p-6 rounded-xl border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Player Progress</h3>
            <select 
              className="input-glass px-3 py-1 rounded-lg text-sm"
              value={selectedPlayer?.username || ''}
              onChange={(e) => {
                const player = players.find(p => p.username === e.target.value);
                setSelectedPlayer(player || null);
              }}
            >
              {players.map(player => (
                <option key={player.username} value={player.username}>
                  {player.username}
                </option>
              ))}
            </select>
          </div>
          
          <div className="h-80">
            {selectedPlayer ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="coinsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(17, 24, 39, 0.8)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="coins" 
                  stroke="#8B5CF6" 
                  fillOpacity={1} 
                  fill="url(#coinsGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-300">No Player Selected</h3>
                  <p className="mt-1 text-sm text-gray-400">Select a player to view their progress chart</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Player List */}
        <div className="glass-card p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Active Players</h3>
          <div className="space-y-4">
            {players.map((player, index) => (
              <div 
                key={player.username}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  selectedPlayer?.username === player.username
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
                onClick={() => setSelectedPlayer(player)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-white">{player.username}</h4>
                  <span className="text-xs text-gray-400">
                    {formatTime(player.lastUpdate)}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center space-x-1">
                    <CurrencyDollarIcon className="h-4 w-4 text-yellow-400" />
                    <span className="text-gray-300">{formatNumber(player.gameData.coins)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <SparklesIcon className="h-4 w-4 text-blue-400" />
                    <span className="text-gray-300">{player.gameData.gems}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <HeartIcon className="h-4 w-4 text-pink-400" />
                    <span className="text-gray-300">{player.gameData.pets}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <GiftIcon className="h-4 w-4 text-green-400" />
                    <span className="text-gray-300">{player.gameData.eggs}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="glass-card p-6 rounded-xl border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[
            { type: 'sync', user: 'Player1', time: '2 minutes ago', details: 'Data synchronized' },
            { type: 'join', user: 'Player3', time: '5 minutes ago', details: 'Connected to dashboard' },
            { type: 'update', user: 'Player2', time: '8 minutes ago', details: 'Coins updated: +150K' },
            { type: 'sync', user: 'Player1', time: '12 minutes ago', details: 'Pet count updated: +2' },
          ].map((activity, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5">
              <div className={`h-2 w-2 rounded-full ${
                activity.type === 'sync' ? 'bg-green-400' :
                activity.type === 'join' ? 'bg-blue-400' : 'bg-purple-400'
              }`}></div>
              <div className="flex-1">
                <p className="text-sm text-white">
                  <span className="font-medium">{activity.user}</span> - {activity.details}
                </p>
                <p className="text-xs text-gray-400">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
