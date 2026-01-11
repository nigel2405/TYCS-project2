import React, { useState, useEffect, useRef } from 'react';
import axios from '../../services/api';
import { animatePageLoad } from '../../utils/animations';
import GlassCard from '../../components/common/GlassCard';
import GlassButton from '../../components/common/GlassButton';
import PageHeader from '../../components/common/PageHeader';
import SkeletonLoader from '../../components/common/SkeletonLoader';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('stats');

  const pageRef = useRef(null);
  const statCardsRef = useRef([]);

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchSessions();
  }, []);

  useEffect(() => {
    if (pageRef.current) {
      animatePageLoad(pageRef.current);
    }
    statCardsRef.current.forEach((card, index) => {
      if (card) {
        setTimeout(() => animatePageLoad(card), index * 100);
      }
    });
  }, [stats]);

  const fetchStats = async () => {
    try {
      const res = await axios.get('/admin/stats');
      setStats(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/admin/users');
      setUsers(res.data.data.users || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await axios.get('/admin/sessions');
      setSessions(res.data.data.sessions || []);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  };

  const handleApproveProvider = async (userId) => {
    try {
      await axios.post(`/admin/providers/${userId}/approve`);
      fetchUsers();
      fetchStats();
      alert('Provider approved successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve provider');
    }
  };

  const handleSuspendProvider = async (userId) => {
    if (!window.confirm('Are you sure you want to suspend this provider?')) return;

    try {
      await axios.post(`/admin/providers/${userId}/suspend`);
      fetchUsers();
      fetchStats();
      alert('Provider suspended successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to suspend provider');
    }
  };

  const handleProcessBilling = async () => {
    if (!window.confirm('Process billing for all active sessions?')) return;

    try {
      await axios.post('/admin/billing/process');
      alert('Billing processed successfully');
      fetchStats();
      fetchSessions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process billing');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-400 text-gray-800',
      active: 'bg-success-500 text-white',
      completed: 'bg-primary-500 text-white',
      cancelled: 'bg-gray-600 text-white',
      terminated: 'bg-red-600 text-white',
    };
    return colors[status] || 'bg-gray-400 text-white';
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-red-600 text-white',
      provider: 'bg-primary-500 text-white',
      consumer: 'bg-success-500 text-white',
    };
    return colors[role] || 'bg-gray-500 text-white';
  };

  if (loading) {
    return (
      <div className="relative z-10">
        <PageHeader title="Admin Dashboard" subtitle="Manage platform, users, and monitor activity" />
        <div className="max-w-7xl mx-auto px-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonLoader key={i} className="h-40" />
            ))}
          </div>
          <SkeletonLoader className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div ref={pageRef} className="relative z-10" style={{ opacity: 0 }}>
      <PageHeader title="Admin Dashboard" subtitle="Manage platform, users, and monitor activity" />

      <div className="max-w-7xl mx-auto px-5 pb-12">
        {error && (
          <div className="glass-card bg-red-500/20 border-red-500/50 p-4 rounded-xl mb-6">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3 mb-8 border-b-2 border-white/10">
          {['stats', 'users', 'sessions'].map((tab) => (
            <button
              key={tab}
              className={`px-6 py-3 text-base font-medium transition-colors border-b-2 ${
                activeTab === tab
                  ? 'text-primary-500 border-primary-500'
                  : 'text-white/60 border-transparent hover:text-primary-500 hover:border-primary-500/50'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'stats' ? 'Platform Stats' : tab === 'users' ? 'Users' : 'Sessions'}
            </button>
          ))}
        </div>

        {activeTab === 'stats' && stats && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <GlassCard
                ref={(el) => (statCardsRef.current[0] = el)}
                className="cursor-glow bg-gradient-to-br from-primary-500/10 to-primary-500/5 border-primary-500/30"
                cursorGlow
                style={{ opacity: 0 }}
              >
                <h3 className="text-sm text-white/70 uppercase tracking-wide mb-4">Users</h3>
                <div className="text-4xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent mb-4">
                  {stats.users.total}
                </div>
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <p className="text-sm text-white/70">Providers: <span className="text-primary-500 font-semibold">{stats.users.providers}</span></p>
                  <p className="text-sm text-white/70">Consumers: <span className="text-success-500 font-semibold">{stats.users.consumers}</span></p>
                  <p className="text-sm text-white/70">Approved Providers: <span className="text-secondary-500 font-semibold">{stats.users.approvedProviders}</span></p>
                </div>
              </GlassCard>
              <GlassCard
                ref={(el) => (statCardsRef.current[1] = el)}
                className="cursor-glow bg-gradient-to-br from-secondary-500/10 to-secondary-500/5 border-secondary-500/30"
                cursorGlow
                style={{ opacity: 0 }}
              >
                <h3 className="text-sm text-white/70 uppercase tracking-wide mb-4">GPUs</h3>
                <div className="text-4xl font-bold text-secondary-500 mb-4">{stats.gpus.total}</div>
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <p className="text-sm text-white/70">Available: <span className="text-success-500 font-semibold">{stats.gpus.available}</span></p>
                  <p className="text-sm text-white/70">Active: <span className="text-primary-500 font-semibold">{stats.gpus.active}</span></p>
                </div>
              </GlassCard>
              <GlassCard
                ref={(el) => (statCardsRef.current[2] = el)}
                className="cursor-glow bg-gradient-to-br from-success-500/10 to-success-500/5 border-success-500/30"
                cursorGlow
                style={{ opacity: 0 }}
              >
                <h3 className="text-sm text-white/70 uppercase tracking-wide mb-4">Sessions</h3>
                <div className="text-4xl font-bold text-success-500 mb-4">{stats.sessions.total}</div>
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <p className="text-sm text-white/70">Active: <span className="text-success-500 font-semibold">{stats.sessions.active}</span></p>
                  <p className="text-sm text-white/70">Completed: <span className="text-primary-500 font-semibold">{stats.sessions.completed}</span></p>
                  <p className="text-sm text-white/70">Pending: <span className="text-yellow-400 font-semibold">{stats.sessions.pending}</span></p>
                </div>
              </GlassCard>
              <GlassCard
                ref={(el) => (statCardsRef.current[3] = el)}
                className="cursor-glow gradient-border bg-gradient-to-br from-primary-500/10 to-secondary-500/5"
                cursorGlow
                style={{ opacity: 0 }}
              >
                <h3 className="text-sm text-white/70 uppercase tracking-wide mb-4">Total Revenue</h3>
                <div className="text-4xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                  ${stats.revenue.total.toFixed(2)}
                </div>
              </GlassCard>
            </div>

            <GlassCard className="cursor-glow" cursorGlow>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Billing Management</h2>
                <GlassButton variant="primary" onClick={handleProcessBilling}>
                  Process Billing for Active Sessions
                </GlassButton>
              </div>
              <p className="text-white/70">
                This will process hourly billing for all currently active sessions.
              </p>
            </GlassCard>
          </div>
        )}

        {activeTab === 'users' && (
          <GlassCard className="cursor-glow" cursorGlow>
            <h2 className="text-2xl font-bold text-white mb-6">All Users</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="glass-card bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-white border-b border-white/10">Username</th>
                    <th className="px-4 py-3 text-left font-semibold text-white border-b border-white/10">Email</th>
                    <th className="px-4 py-3 text-left font-semibold text-white border-b border-white/10">Role</th>
                    <th className="px-4 py-3 text-left font-semibold text-white border-b border-white/10">Approved</th>
                    <th className="px-4 py-3 text-left font-semibold text-white border-b border-white/10">Wallet</th>
                    <th className="px-4 py-3 text-left font-semibold text-white border-b border-white/10">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id || user._id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-white/90">{user.username}</td>
                      <td className="px-4 py-3 text-white/70">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {user.role === 'provider' ? (
                          user.isProviderApproved ? (
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor('active')}`}>
                              Approved
                            </span>
                          ) : (
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor('pending')}`}>
                              Pending
                            </span>
                          )
                        ) : (
                          <span className="text-white/40">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-secondary-500 font-semibold">${user.walletBalance?.toFixed(2) || '0.00'}</td>
                      <td className="px-4 py-3">
                        {user.role === 'provider' && !user.isProviderApproved && (
                          <GlassButton variant="success" size="sm" onClick={() => handleApproveProvider(user.id || user._id)}>
                            Approve
                          </GlassButton>
                        )}
                        {user.role === 'provider' && user.isProviderApproved && (
                          <GlassButton variant="danger" size="sm" onClick={() => handleSuspendProvider(user.id || user._id)}>
                            Suspend
                          </GlassButton>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {activeTab === 'sessions' && (
          <GlassCard className="cursor-glow" cursorGlow>
            <h2 className="text-2xl font-bold text-white mb-6">All Sessions</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="glass-card bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-white border-b border-white/10">Consumer</th>
                    <th className="px-4 py-3 text-left font-semibold text-white border-b border-white/10">Provider</th>
                    <th className="px-4 py-3 text-left font-semibold text-white border-b border-white/10">GPU</th>
                    <th className="px-4 py-3 text-left font-semibold text-white border-b border-white/10">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-white border-b border-white/10">Duration</th>
                    <th className="px-4 py-3 text-left font-semibold text-white border-b border-white/10">Cost</th>
                    <th className="px-4 py-3 text-left font-semibold text-white border-b border-white/10">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session._id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-white/90">{session.consumer?.username || 'Unknown'}</td>
                      <td className="px-4 py-3 text-white/90">{session.provider?.username || 'Unknown'}</td>
                      <td className="px-4 py-3 text-white/70">{session.gpu?.name || 'Unknown'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(session.status)}`}>
                          {session.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/70">{Math.round((session.duration || 0) / 60)}h</td>
                      <td className="px-4 py-3 text-secondary-500 font-semibold">${session.totalCost?.toFixed(2) || '0.00'}</td>
                      <td className="px-4 py-3 text-white/70">{new Date(session.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
