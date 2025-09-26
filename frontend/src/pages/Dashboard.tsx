import { useState, useEffect, useCallback } from 'react';
import { 
  CurrencyDollarIcon, 
  SparklesIcon, 
  HeartIcon, 
  GiftIcon,
  ChartBarIcon,
  ClockIcon,
  UserIcon,
  SignalIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSocket } from '../contexts/SocketContext';
import { useApi } from '../contexts/ApiContext';

interface PlayerData {
  username: string;
  lastUpdate: string;
  gameData: {
    coins: number;
    pets: number;
    eggs: number;
    gems: number;
  };
}

interface GlobalStats {
  totalPlayers: number;
  onlinePlayers: number;
  totalSyncs: number;
  avgCoins: number;
}

const Dashboard = () => {
  const { isConnected } = useSocket();
  const { apiCall } = useApi();
  
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [stats, setStats] = useState<GlobalStats>({
    totalPlayers: 0,
    onlinePlayers: 0,
    totalSyncs: 0,
    avgCoins: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Stable data loading function
  const loadDashboardData = useCallback(async () => {
    try {
      // Load player data
      const playersResponse = await apiCall('/api/players');
      if (playersResponse && Array.isArray(playersResponse)) {
        setPlayers(playersResponse);
        
        // Calculate stats from player data
        const newStats = {
          totalPlayers: playersResponse.length,
          onlinePlayers: playersResponse.filter(p => {
            const lastUpdateTime = new Date(p.lastUpdate).getTime();
            const now = Date.now();
            return (now - lastUpdateTime) < 5 * 60 * 1000; // Online if updated within 5 minutes
          }).length,
          totalSyncs: playersResponse.length * 10, // Estimate
          avgCoins: playersResponse.length > 0 
            ? Math.round(playersResponse.reduce((sum, p) => sum + (p.gameData?.coins || 0), 0) / playersResponse.length)
            : 0
        };
        setStats(newStats);
        setLastUpdate(new Date().toISOString());
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [apiCall]);

  // Initial load
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Periodic refresh (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    subtitle?: string;
  }) => (
    <div className="glass-card p-6 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300 group">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">Zebux Dashboard</h1>
        <p className="text-gray-400 text-lg mb-4">
          Real-time game data tracking and analytics
        </p>
        <div className="flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-2 glass-card px-4 py-2 rounded-lg border border-white/10">
            <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm text-gray-300 font-medium">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {lastUpdate && (
            <div className="glass-card px-4 py-2 rounded-lg border border-white/10">
              <span className="text-sm text-gray-300">
                Updated {formatTime(lastUpdate)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Players"
          value={stats.totalPlayers}
          icon={UserIcon}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          subtitle="Registered users"
        />
        <StatCard
          title="Online Now"
          value={stats.onlinePlayers}
          icon={SignalIcon}
          color="bg-gradient-to-br from-green-500 to-green-600"
          subtitle="Active in last 5min"
        />
        <StatCard
          title="Total Syncs"
          value={formatNumber(stats.totalSyncs)}
          icon={ChartBarIcon}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          subtitle="Data updates"
        />
        <StatCard
          title="Avg Coins"
          value={formatNumber(stats.avgCoins)}
          icon={CurrencyDollarIcon}
          color="bg-gradient-to-br from-yellow-500 to-yellow-600"
          subtitle="Per player"
        />
      </div>

      {/* Main Content */}
      {players.length === 0 ? (
        /* No Data State */
        <div className="glass-card p-12 rounded-2xl border border-white/10 text-center">
          <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-8 shadow-2xl">
            <SparklesIcon className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-4">Ready to Start Tracking?</h3>
          <p className="text-gray-400 mb-12 max-w-2xl mx-auto text-lg">
            Get started by generating a token and running our sync script in your game. 
            Your data will appear here automatically!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
            <div className="glass-card p-8 rounded-xl border border-white/10 hover:border-purple-500/50 transition-all duration-300 group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">1</div>
              <h4 className="text-white font-bold text-xl mb-3">Generate Token</h4>
              <p className="text-gray-400">Get your unique sync token instantly with one click</p>
            </div>
            
            <div className="glass-card p-8 rounded-xl border border-white/10 hover:border-purple-500/50 transition-all duration-300 group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">2</div>
              <h4 className="text-white font-bold text-xl mb-3">Run Script</h4>
              <p className="text-gray-400">Execute our Lua script in your game to start syncing</p>
            </div>
            
            <div className="glass-card p-8 rounded-xl border border-white/10 hover:border-purple-500/50 transition-all duration-300 group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">3</div>
              <h4 className="text-white font-bold text-xl mb-3">Watch Magic</h4>
              <p className="text-gray-400">Monitor your progress with beautiful real-time analytics</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a href="/token" className="glass-button-enhanced inline-flex items-center px-10 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300">
              <GiftIcon className="h-5 w-5 mr-2" />
              Generate Token
            </a>
            <a href="/about" className="glass-card inline-flex items-center px-10 py-4 rounded-xl font-semibold text-lg border border-white/10 text-gray-300 hover:text-white hover:border-purple-500/50 transition-all duration-300">
              <ClockIcon className="h-5 w-5 mr-2" />
              Learn More
            </a>
          </div>
        </div>
      ) : (
        /* Data Display */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Players List */}
          <div className="glass-card p-6 rounded-xl border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <UserIcon className="h-5 w-5 mr-2" />
              Active Players ({players.length})
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {players.map((player, index) => (
                <div key={player.username} className="flex items-center justify-between p-4 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {player.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{player.username}</p>
                      <p className="text-xs text-gray-400">{formatTime(player.lastUpdate)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <CurrencyDollarIcon className="h-4 w-4 text-yellow-400" />
                        <span className="text-gray-300">{formatNumber(player.gameData?.coins || 0)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <HeartIcon className="h-4 w-4 text-red-400" />
                        <span className="text-gray-300">{player.gameData?.pets || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CubeIcon className="h-4 w-4 text-blue-400" />
                        <span className="text-gray-300">{player.gameData?.eggs || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="glass-card p-6 rounded-xl border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <ClockIcon className="h-5 w-5 mr-2" />
              Recent Activity
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {players.slice(0, 8).map((player, index) => (
                <div key={`${player.username}-${index}`} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="h-2 w-2 rounded-full bg-green-400"></div>
                  <div className="flex-1">
                    <p className="text-sm text-white">
                      <span className="font-medium">{player.username}</span> synced data
                    </p>
                    <p className="text-xs text-gray-400">{formatTime(player.lastUpdate)}</p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatNumber(player.gameData?.coins || 0)} coins
                  </div>
                </div>
              ))}
              {players.length === 0 && (
                <div className="text-center py-8">
                  <ClockIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-400">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
