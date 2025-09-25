import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  CurrencyDollarIcon, 
  SparklesIcon, 
  HeartIcon, 
  GiftIcon,
  ChartBarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useApi } from '../contexts/ApiContext';

interface PlayerData {
  id: number;
  username: string;
  displayName: string;
  userId: number;
  token: string;
  lastUpdate: string;
  gameData: {
    coins: number;
    gems: number;
    pets: number;
    eggs: number;
    mutations: number;
  };
  history: Array<{
    timestamp: string;
    coins: number;
    gems: number;
    pets: number;
    eggs: number;
    mutations: number;
  }>;
  isOnline: boolean;
}

const PlayerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const { apiCall } = useApi();

  useEffect(() => {
    if (id) {
      loadPlayerData();
    }
  }, [id, timeRange]);

  const loadPlayerData = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const [playerResponse, historyResponse] = await Promise.all([
        apiCall(`/players/${id}`),
        apiCall(`/players/${id}/history?interval=${timeRange === '24h' ? 'hourly' : timeRange === '7d' ? 'daily' : 'weekly'}&limit=${timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30}`)
      ]);

      if (playerResponse.success) {
        setPlayer({
          ...playerResponse.player,
          history: historyResponse.success ? historyResponse.history : []
        });
      }
    } catch (error) {
      console.error('Failed to load player data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getChangePercent = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white">Player Not Found</h2>
        <p className="text-gray-400 mt-2">The requested player could not be found.</p>
        <Link to="/" className="glass-button-enhanced inline-block mt-4 px-6 py-2 rounded-lg">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const previousData = player.history.length > 1 ? player.history[player.history.length - 2] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <ArrowLeftIcon className="h-5 w-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">{player.username}</h1>
            <p className="text-gray-400 mt-1">
              Player Details • Last updated {formatDate(player.lastUpdate)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`h-3 w-3 rounded-full ${player.isOnline ? 'bg-green-400' : 'bg-gray-400'}`}></div>
          <span className="text-sm text-gray-300">
            {player.isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Player Info */}
      <div className="glass-card p-6 rounded-xl border border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-400">Display Name</h3>
            <p className="text-lg font-semibold text-white mt-1">{player.displayName}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-400">User ID</h3>
            <p className="text-lg font-semibold text-white mt-1">{player.userId}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-400">Token</h3>
            <p className="text-lg font-mono text-white mt-1">{player.token.substring(0, 20)}...</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { 
            title: 'Coins', 
            value: formatNumber(player.gameData.coins), 
            icon: CurrencyDollarIcon, 
            color: 'text-yellow-400',
            change: previousData ? getChangePercent(player.gameData.coins, previousData.coins) : null
          },
          { 
            title: 'Gems', 
            value: formatNumber(player.gameData.gems), 
            icon: SparklesIcon, 
            color: 'text-blue-400',
            change: previousData ? getChangePercent(player.gameData.gems, previousData.gems) : null
          },
          { 
            title: 'Pets', 
            value: player.gameData.pets, 
            icon: HeartIcon, 
            color: 'text-pink-400',
            change: previousData ? getChangePercent(player.gameData.pets, previousData.pets) : null
          },
          { 
            title: 'Eggs', 
            value: player.gameData.eggs, 
            icon: GiftIcon, 
            color: 'text-green-400',
            change: previousData ? getChangePercent(player.gameData.eggs, previousData.eggs) : null
          },
          { 
            title: 'Mutations', 
            value: player.gameData.mutations, 
            icon: SparklesIcon, 
            color: 'text-purple-400',
            change: previousData ? getChangePercent(player.gameData.mutations, previousData.mutations) : null
          }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="glass-card p-6 rounded-xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <Icon className={`h-6 w-6 ${stat.color}`} />
                {stat.change && (
                  <span className={`text-xs px-2 py-1 rounded ${
                    parseFloat(stat.change) >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {parseFloat(stat.change) >= 0 ? '+' : ''}{stat.change}%
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-gray-400">{stat.title}</p>
              <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="glass-card p-6 rounded-xl border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Progress History</h3>
          <div className="flex space-x-2">
            {['24h', '7d', '30d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  timeRange === range
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {player.history.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={player.history}>
                <defs>
                  <linearGradient id="coinsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="petsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EC4899" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EC4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="#9CA3AF"
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(17, 24, 39, 0.8)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                />
                <Area 
                  type="monotone" 
                  dataKey="coins" 
                  stroke="#F59E0B" 
                  fillOpacity={1} 
                  fill="url(#coinsGradient)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="pets" 
                  stroke="#EC4899" 
                  fillOpacity={1} 
                  fill="url(#petsGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-300">No history data</h3>
            <p className="mt-1 text-sm text-gray-400">
              Historical data will appear here once the player starts syncing regularly.
            </p>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="glass-card p-6 rounded-xl border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {player.history.slice(-5).reverse().map((entry, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5">
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                <div>
                  <p className="text-sm text-white">Data synchronized</p>
                  <p className="text-xs text-gray-400">{formatDate(entry.timestamp)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-300">
                  {formatNumber(entry.coins)} coins, {entry.pets} pets
                </p>
              </div>
            </div>
          ))}
          
          {player.history.length === 0 && (
            <div className="text-center py-8">
              <ClockIcon className="mx-auto h-8 w-8 text-gray-400" />
              <p className="text-sm text-gray-400 mt-2">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerDetail;
