import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../../services/api';
import { io } from 'socket.io-client';
import { AuthContext } from '../../contexts/AuthContext';
import { animatePageLoad } from '../../utils/animations';
import GlassCard from '../../components/common/GlassCard';
import GlassButton from '../../components/common/GlassButton';
import PageHeader from '../../components/common/PageHeader';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import ChatWindow from '../../components/chat/ChatWindow';

const SessionDetails = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [session, setSession] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const pageRef = useRef(null);
  const infoCardRef = useRef(null);
  const metricsCardRef = useRef(null);
  const chatCardRef = useRef(null);

  const fetchSession = useCallback(async () => {
    try {
      const res = await axios.get(`/sessions/${id}`);
      setSession(res.data.data.session);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch session');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await axios.get(`/sessions/${id}/metrics`);
      if (res.data?.data?.metrics) {
        setMetrics(res.data.data.metrics);
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    }
  }, [id]);

  const updateMetrics = useCallback(async () => {
    try {
      await axios.put(`/sessions/${id}/metrics`);
      fetchMetrics();
    } catch (err) {
      console.error('Failed to update metrics:', err);
    }
  }, [id, fetchMetrics]);

  // Initial fetch
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    if (session?.status === 'active') {
      fetchMetrics();
    }
  }, [session?.status, fetchMetrics]);

  // Socket connection
  useEffect(() => {
    // Socket.io needs the base URL, NOT the /api prefixed one
    const baseUrl = (process.env.REACT_APP_API_URL || '').replace(/\/api$/, '');
    const newSocket = io(baseUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5
    });
    setSocket(newSocket);

    newSocket.emit('join-session', id);

    newSocket.on('session-ready', (data) => {
      console.log('Session ready:', data);
      setSession(prev => prev ? {
        ...prev,
        status: 'active',
        connectionUrl: data.connectionUrl
      } : prev);
    });

    newSocket.on('session-failed', (data) => {
      console.error('Session failed:', data);
      setError(data.error || 'Failed to provision session environment');
      setSession(prev => prev ? {
        ...prev,
        status: 'terminated'
      } : prev);
    });

    newSocket.on('connect_error', (err) => {
      console.warn('Socket connection error. Retrying...', err.message);
    });

    return () => {
      newSocket.emit('leave-session', id);
      newSocket.close();
    };
  }, [id]);

  useEffect(() => {
    if (!loading && session) {
      if (pageRef.current) {
        animatePageLoad(pageRef.current);
      }
      if (infoCardRef.current) {
        setTimeout(() => animatePageLoad(infoCardRef.current), 200);
      }
      if (metricsCardRef.current) {
        setTimeout(() => animatePageLoad(metricsCardRef.current), 400);
      }
      if (chatCardRef.current) {
        setTimeout(() => animatePageLoad(chatCardRef.current), 600);
      }
    }
  }, [loading]);

  useEffect(() => {
    // Only poll if the session is active AND we haven't hit a fatal error
    if (session?.status === 'active' && !error) {
      const interval = setInterval(() => {
        updateMetrics().catch(() => { }); // Silent catch for network flickers
        fetchSession().catch(() => { });
      }, 8000); // Increased to 8s to reduce overhead

      return () => clearInterval(interval);
    }
  }, [session?.status, error, updateMetrics, fetchSession]);

  const handleStartSession = async () => {
    try {
      await axios.post(`/sessions/${id}/start`);
      // Optimistic update or just wait for socket
      setSession(prev => ({ ...prev, status: 'active' })); // Mark active locally to show spinner
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start session');
    }
  };

  const handleStopSession = async () => {
    if (!window.confirm('Are you sure you want to stop this session? Final billing will be processed.')) {
      return;
    }

    try {
      await axios.post(`/sessions/${id}/stop`);
      fetchSession();
      alert('Session stopped successfully');

      // Prompt for review if consumer
      if (session.consumer?._id === user.id || session.consumer === user.id) {
        setShowReviewModal(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to stop session');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/sessions/${id}/review`, {
        rating: reviewRating,
        comment: reviewComment
      });
      alert('Review submitted successfully!');
      setShowReviewModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
      setShowReviewModal(false);
    }
  };

  const handleCancelSession = async () => {
    if (!window.confirm('Are you sure you want to cancel this session?')) {
      return;
    }

    try {
      await axios.post(`/sessions/${id}/cancel`, { reason: 'Cancelled by user' });
      fetchSession();
      alert('Session cancelled successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel session');
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
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

  const handleLaunch = () => {
    if (session.connectionUrl) {
      window.open(session.connectionUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="relative z-10">
        <PageHeader title="Session Details" subtitle="Monitor and manage your GPU session" />
        <div className="max-w-7xl mx-auto px-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <SkeletonLoader className="h-96" />
            <SkeletonLoader className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="relative z-10">
        <PageHeader title="Session Details" subtitle="Monitor and manage your GPU session" />
        <div className="max-w-7xl mx-auto px-5">
          <div className="glass-card bg-red-500/20 border-red-500/50 p-4 rounded-xl">
            <p className="text-red-300">Session not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={pageRef} className="relative z-10" >
      {/* ... (keep header) ... */}
      <PageHeader title="Session Details" subtitle="Monitor and manage your GPU session" />

      <div className="max-w-7xl mx-auto px-5 pb-12">
        {/* ... (keep error display) ... */}
        {error && (
          <div className="glass-card bg-red-500/20 border-red-500/50 p-4 rounded-xl mb-6">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <GlassCard
            ref={infoCardRef}
            className="cursor-glow"
            cursorGlow

          >
            <h2 className="text-2xl font-bold text-white mb-6">Session Information</h2>
            <div className="space-y-4">
              {/* ... (keep existing fields: status, gpu, provider, consumer, rate, duration, cost, start/end) ... */}
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <strong className="text-white/90">Status:</strong>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(session.status)}`}>
                  {session.status.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-white/10">
                <strong className="text-white/90">GPU:</strong>
                <span className="text-white/70">{session.gpu?.name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-white/10">
                <strong className="text-white/90">Provider:</strong>
                <span className="text-white/70">{session.provider?.username || 'Unknown'}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-white/10">
                <strong className="text-white/90">Consumer:</strong>
                <span className="text-white/70">{session.consumer?.username || 'Unknown'}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-white/10">
                <strong className="text-white/90">Hourly Rate:</strong>
                <span className="text-secondary-500 font-semibold">${session.hourlyRate}/hour</span>
              </div>
              <div className="flex justify-between py-3 border-b border-white/10">
                <strong className="text-white/90">Duration:</strong>
                <span className="text-white/70">{formatDuration(session.duration || 0)}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-white/10">
                <strong className="text-white/90">Total Cost:</strong>
                <span className="text-primary-500 font-bold text-lg">${session.totalCost?.toFixed(2) || '0.00'}</span>
              </div>
              {session.startTime && (
                <div className="flex justify-between py-3 border-b border-white/10">
                  <strong className="text-white/90">Started:</strong>
                  <span className="text-white/70">{new Date(session.startTime).toLocaleString()}</span>
                </div>
              )}
              {session.endTime && (
                <div className="flex justify-between py-3 border-b border-white/10">
                  <strong className="text-white/90">Ended:</strong>
                  <span className="text-white/70">{new Date(session.endTime).toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              {session.status === 'pending' && (
                <>
                  <GlassButton variant="success" onClick={handleStartSession}>
                    Start Session
                  </GlassButton>
                  <GlassButton variant="danger" onClick={handleCancelSession}>
                    Cancel Session
                  </GlassButton>
                </>
              )}
              {session.status === 'active' && (
                <>
                  {session.connectionUrl ? (
                    <GlassButton variant="primary" onClick={handleLaunch} className="animate-pulse">
                      Launch Environment
                    </GlassButton>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
                      <div className="w-4 h-4 rounded-full border-2 border-primary-500 border-t-transparent animate-spin"></div>
                      <span className="text-white/70 text-sm">Provisioning Environment...</span>
                    </div>
                  )}
                  <GlassButton variant="danger" onClick={handleStopSession}>
                    Stop Session
                  </GlassButton>
                </>
              )}
            </div>

            {session.status === 'active' && session.connectionDetails && !session.connectionUrl && (
              <div className="mt-8 p-6 glass-card bg-white/5 rounded-xl border border-primary-500/30">
                <h3 className="text-lg font-bold text-white mb-4">Legacy Connection Details</h3>
                <div className="space-y-2">
                  <p className="text-white/70"><strong className="text-white">IP:</strong> <span className="text-primary-500">{session.connectionDetails.ip}</span></p>
                  <p className="text-white/70"><strong className="text-white">Port:</strong> <span className="text-primary-500">{session.connectionDetails.port}</span></p>
                  <p className="text-white/70"><strong className="text-white">Access Token:</strong> <span className="text-primary-500 font-mono text-sm">{session.connectionDetails.accessToken}</span></p>
                </div>
              </div>
            )}
          </GlassCard>

          <div className="space-y-8">
            {session.status === 'active' && metrics && (
              <GlassCard
                ref={metricsCardRef}
                className="cursor-glow gradient-border"
                cursorGlow

              >
                <h2 className="text-2xl font-bold text-white mb-6">GPU Metrics</h2>
                <div className="grid grid-cols-1 gap-6 mb-6">
                  <GlassCard className="p-6 bg-gradient-to-br from-primary-500/10 to-primary-500/5 border-primary-500/30">
                    <div className="text-sm text-white/70 mb-2">GPU Utilization</div>
                    <div className="text-4xl font-bold text-primary-500 mb-4">
                      {metrics.averages?.utilization || 0}%
                    </div>
                    <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500"
                        style={{ width: `${metrics.averages?.utilization || 0}%` }}
                      ></div>
                    </div>
                  </GlassCard>
                  <div className="grid grid-cols-2 gap-4">
                    <GlassCard className="p-6 bg-gradient-to-br from-success-500/10 to-success-500/5 border-success-500/30">
                      <div className="text-sm text-white/70 mb-2">Temperature</div>
                      <div className="text-3xl font-bold text-success-500">
                        {metrics.averages?.temperature || 0}°C
                      </div>
                    </GlassCard>
                    <GlassCard className="p-6 bg-gradient-to-br from-secondary-500/10 to-secondary-500/5 border-secondary-500/30">
                      <div className="text-sm text-white/70 mb-2">Memory Used</div>
                      <div className="text-3xl font-bold text-secondary-500">
                        {((metrics.averages?.memoryUsed || 0) / 1024).toFixed(2)} GB
                      </div>
                    </GlassCard>
                  </div>
                </div>
                {metrics.lastUpdated && (
                  <p className="text-sm text-white/60 text-center mt-4">
                    Last updated: {new Date(metrics.lastUpdated).toLocaleTimeString()}
                  </p>
                )}
              </GlassCard>
            )}

            {/* Chat Window */}
            <div ref={chatCardRef} >
              <ChatWindow sessionId={id} socket={socket} user={user} />
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <GlassCard className="w-full max-w-lg p-6 animate-fade-in border-primary-500/30">
            <h2 className="text-2xl font-bold text-white mb-4">Rate Your Session</h2>
            <p className="mb-6 text-white/70">How was your experience using {session?.gpu?.name || 'this GPU'}?</p>
            <form onSubmit={handleSubmitReview}>
              <div className="mb-4">
                <label className="block text-sm mb-2 text-white/90">Rating (1-5 Stars)</label>
                <div className="flex gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className={`text-4xl ${reviewRating >= star ? 'text-yellow-400' : 'text-gray-600'} hover:scale-110 transition-transform`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm mb-2 text-white/90">Feedback (Optional)</label>
                <textarea
                  className="w-full bg-white/5 border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:border-primary-500/50 placeholder-white/30"
                  rows="3"
                  placeholder="Tell others what you thought!"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                ></textarea>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <GlassButton type="button" variant="secondary" onClick={() => setShowReviewModal(false)}>
                  Skip
                </GlassButton>
                <GlassButton type="submit" variant="primary">
                  Submit Review
                </GlassButton>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default SessionDetails;
