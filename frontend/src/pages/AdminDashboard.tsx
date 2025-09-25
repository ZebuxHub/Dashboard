import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserGroupIcon, 
  KeyIcon, 
  ChartBarIcon, 
  ExclamationTriangleIcon,
  TrashIcon,
  BanIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useApi } from '../contexts/ApiContext';
import toast from 'react-hot-toast';

interface User {
  id: number;
  username: string;
  token: string;
  createdAt: string;
  lastSync: string;
  totalSyncs: number;
  isActive: boolean;
  ipAddress: string;
  hwid: string;
}

interface Stats {
  totalUsers: number;
  activeTokens: number;
  totalSyncs: number;
  onlineUsers: number;
  todaySyncs: number;
  avgSyncInterval: number;
}

const AdminDashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { apiCall } = useApi();

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }

    loadData();
  }, [navigate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsResponse, usersResponse] = await Promise.all([
        apiCall('/admin/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        }),
        apiCall('/admin/users', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        })
      ]);

      if (statsResponse.success) {
        setStats(statsResponse.stats);
      }

      if (usersResponse.success) {
        setUsers(usersResponse.users);
      }
    } catch (error) {
      console.error('Failed to load admin data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const banUser = async (userId: number, banned: boolean, reason?: string) => {
    try {
      const response = await apiCall(`/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ banned, reason })
      });

      if (response.success) {
        toast.success(`User ${banned ? 'banned' : 'unbanned'} successfully`);
        loadData();
      } else {
        toast.error(response.error || 'Operation failed');
      }
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const deleteToken = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user\'s token? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await apiCall(`/admin/users/${userId}/token`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.success) {
        toast.success('Token deleted successfully');
        loadData();
      } else {
        toast.error(response.error || 'Failed to delete token');
      }
    } catch (error) {
      toast.error('Failed to delete token');
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">
            System administration and user management
          </p>
        </div>
        <button
          onClick={logout}
          className="glass-button-enhanced px-4 py-2 rounded-lg text-sm"
        >
          Logout
        </button>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card p-6 rounded-xl border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-white mt-1">{formatNumber(stats.totalUsers)}</p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Active Tokens</p>
                <p className="text-2xl font-bold text-white mt-1">{formatNumber(stats.activeTokens)}</p>
              </div>
              <KeyIcon className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Syncs</p>
                <p className="text-2xl font-bold text-white mt-1">{formatNumber(stats.totalSyncs)}</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-purple-400" />
            </div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Today's Syncs</p>
                <p className="text-2xl font-bold text-white mt-1">{formatNumber(stats.todaySyncs)}</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="glass-card rounded-xl border border-white/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">User Management</h3>
          <p className="text-sm text-gray-400 mt-1">
            Manage user accounts, tokens, and access permissions
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Token
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Last Sync
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Total Syncs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/5">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-white">{user.username}</div>
                      <div className="text-sm text-gray-400">ID: {user.id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-gray-300">
                      {user.token.substring(0, 20)}...
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {formatDate(user.lastSync)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {formatNumber(user.totalSyncs)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Banned'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => banUser(user.id, !user.isActive)}
                      className={`inline-flex items-center px-3 py-1 rounded text-xs ${
                        user.isActive
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {user.isActive ? (
                        <>
                          <BanIcon className="h-3 w-3 mr-1" />
                          Ban
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Unban
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => deleteToken(user.id)}
                      className="inline-flex items-center px-3 py-1 rounded text-xs bg-gray-600 hover:bg-gray-700 text-white"
                    >
                      <TrashIcon className="h-3 w-3 mr-1" />
                      Delete Token
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-300">No users found</h3>
            <p className="mt-1 text-sm text-gray-400">
              Users will appear here once they generate tokens and start syncing data.
            </p>
          </div>
        )}
      </div>

      {/* System Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Server Status</span>
              <span className="text-green-400">Online</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Database</span>
              <span className="text-green-400">Connected</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">WebSocket</span>
              <span className="text-green-400">Active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">API Version</span>
              <span className="text-gray-300">1.0.0</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 text-gray-300">
              Export User Data
            </button>
            <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 text-gray-300">
              System Logs
            </button>
            <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 text-gray-300">
              Backup Database
            </button>
            <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 text-gray-300">
              Clear Cache
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
