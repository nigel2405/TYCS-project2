import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/api';
import { animatePageLoad, animateTextReveal } from '../../utils/animations';
import GlassCard from '../../components/common/GlassCard';
import GlassButton from '../../components/common/GlassButton';
import PageHeader from '../../components/common/PageHeader';
import SkeletonLoader from '../../components/common/SkeletonLoader';

const ProviderDashboard = () => {
  const [gpus, setGPUs] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawData, setWithdrawData] = useState({ amount: '', paypalEmail: '' });
  const [formData, setFormData] = useState({
    name: '',
    pricePerHour: '',
    manufacturer: '',
    model: '',
    vram: '',
  });
  const [maxVram, setMaxVram] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const navigate = useNavigate();

  const pageRef = useRef(null);
  const cardsRef = useRef([]);
  const earningsRef = useRef(null);

  useEffect(() => {
    fetchGPUs();
    fetchEarnings();
  }, []);

  useEffect(() => {
    if (pageRef.current) {
      animatePageLoad(pageRef.current);
    }
    if (earningsRef.current) {
      setTimeout(() => animateTextReveal(earningsRef.current), 300);
    }
    cardsRef.current.forEach((card, index) => {
      if (card) {
        setTimeout(() => animatePageLoad(card), index * 100);
      }
    });
  }, [gpus, earnings]);

  const fetchGPUs = async () => {
    try {
      const res = await axios.get('/provider/gpus');
      setGPUs(res.data.data.gpus || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch GPUs');
    } finally {
      setLoading(false);
    }
  };

  const fetchEarnings = async () => {
    try {
      const res = await axios.get('/provider/earnings');
      setEarnings(res.data.data);
    } catch (err) {
      console.error('Failed to fetch earnings:', err);
    }
  };

  const handleRequestWithdrawal = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      await axios.post('/payments/withdraw', withdrawData);
      setSuccessMsg('Withdrawal request submitted! Admin will process it soon.');
      setShowWithdrawForm(false);
      setWithdrawData({ amount: '', paypalEmail: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request withdrawal');
    }
  };

  const handleScanGPU = async (e) => {
    e.preventDefault();
    setError('');
    setIsScanning(true);
    try {
      const res = await axios.get('/provider/gpus/detect');
      const specs = res.data.data.gpuSpecs;
      setMaxVram(specs.vram);
      setFormData(prev => ({
        ...prev,
        manufacturer: specs.manufacturer,
        model: specs.model,
        vram: specs.vram, // Default to sharing all of it
        name: `${specs.manufacturer} ${specs.model}`
      }));
      setSuccessMsg('Hardware scanned successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to scan hardware.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleRegisterGPU = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.manufacturer || !formData.model) {
      return setError('Please scan your hardware first before registering.');
    }

    try {
      const res = await axios.post('/provider/gpus', formData);
      setGPUs([res.data.data.gpu, ...gpus]);
      setShowRegisterForm(false);
      setFormData({ name: '', pricePerHour: '', manufacturer: '', model: '', vram: '' });
      setMaxVram(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register GPU');
    }
  };

  const handleToggleAvailability = async (gpuId, currentStatus) => {
    try {
      await axios.put(`/provider/gpus/${gpuId}`, {
        isAvailable: !currentStatus,
      });
      fetchGPUs();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update GPU');
    }
  };

  const handleDeleteGPU = async (gpuId) => {
    if (!window.confirm('Are you sure you want to delete this GPU?')) return;

    try {
      await axios.delete(`/provider/gpus/${gpuId}`);
      setGPUs(gpus.filter((gpu) => gpu._id !== gpuId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete GPU');
    }
  };

  if (loading) {
    return (
      <div className="relative z-10">
        <PageHeader title="Provider Dashboard" subtitle="Manage your GPUs and view earnings" />
        <div className="max-w-7xl mx-auto px-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonLoader key={i} className="h-32" />
            ))}
          </div>
          <SkeletonLoader className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div ref={pageRef} className="relative z-10" >
      <PageHeader title="Provider Dashboard" subtitle="Manage your GPUs and view earnings" />

      <div className="max-w-7xl mx-auto px-5 pb-12">
        {error && (
          <div className="glass-card bg-red-500/20 border-red-500/50 p-4 rounded-xl mb-6">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}
        {successMsg && (
          <div className="glass-card bg-success-500/20 border-success-500/50 p-4 rounded-xl mb-6">
            <p className="text-success-300 text-sm">{successMsg}</p>
          </div>
        )}

        {earnings && (
          <GlassCard
            ref={earningsRef}
            className="mb-8 cursor-glow gradient-border"
            cursorGlow

          >
            <h2 className="text-2xl font-bold text-white mb-6">Earnings Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <GlassCard className="p-6 bg-gradient-to-br from-primary-500/10 to-primary-500/5 border-primary-500/30">
                <span className="text-sm text-white/70 mb-2 block">Total Earnings</span>
                <span className="text-3xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                  ${earnings.totalEarnings?.toFixed(2) || '0.00'}
                </span>
              </GlassCard>
              <GlassCard className="p-6 bg-gradient-to-br from-secondary-500/10 to-secondary-500/5 border-secondary-500/30">
                <span className="text-sm text-white/70 mb-2 block">Total Hours Rented</span>
                <span className="text-3xl font-bold text-secondary-500">
                  {earnings.totalHoursRented?.toFixed(2) || '0.00'}
                </span>
              </GlassCard>
              <GlassCard className="p-6 bg-gradient-to-br from-success-500/10 to-success-500/5 border-success-500/30">
                <span className="text-sm text-white/70 mb-2 block">Active Sessions</span>
                <span className="text-3xl font-bold text-success-500">
                  {earnings.activeSessions || 0}
                </span>
              </GlassCard>
              <GlassCard className="p-6 bg-gradient-to-br from-primary-500/10 to-secondary-500/5 border-primary-500/30">
                <span className="text-sm text-white/70 mb-2 block">Total GPUs</span>
                <span className="text-3xl font-bold text-primary-500">
                  {earnings.gpuCount || 0}
                </span>
              </GlassCard>
            </div>

            <div className="mt-6 flex justify-end">
              <GlassButton variant={showWithdrawForm ? "secondary" : "success"} onClick={() => setShowWithdrawForm(!showWithdrawForm)}>
                {showWithdrawForm ? 'Cancel' : 'Withdraw Earnings'}
              </GlassButton>
            </div>

            {/* Withdrawal Form */}
            {showWithdrawForm && (
              <form onSubmit={handleRequestWithdrawal} className="mt-6 p-6 glass-card bg-white/5 rounded-xl border border-white/10 animate-fade-in">
                <h3 className="text-lg font-bold text-white mb-4">Request Payout via PayPal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="relative">
                    <input
                      type="number"
                      min="5"
                      step="1"
                      placeholder=" "
                      required
                      value={withdrawData.amount}
                      onChange={(e) => setWithdrawData({ ...withdrawData, amount: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/5 backdrop-blur-md text-white placeholder-transparent focus:outline-none focus:border-primary-500/50 transition-all z-10 relative"
                    />
                    <label className={`absolute left-4 transition-all pointer-events-none z-20 ${withdrawData.amount ? 'top-1 text-xs text-primary-500' : 'top-3 text-white/60'}`}>
                      Amount ($)
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder=" "
                      required
                      value={withdrawData.paypalEmail}
                      onChange={(e) => setWithdrawData({ ...withdrawData, paypalEmail: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/5 backdrop-blur-md text-white placeholder-transparent focus:outline-none focus:border-primary-500/50 transition-all z-10 relative"
                    />
                    <label className={`absolute left-4 transition-all pointer-events-none z-20 ${withdrawData.paypalEmail ? 'top-1 text-xs text-primary-500' : 'top-3 text-white/60'}`}>
                      PayPal Email Address
                    </label>
                  </div>
                </div>
                <GlassButton type="submit" variant="primary">Submit Request</GlassButton>
              </form>
            )}
          </GlassCard>
        )}

        {/* Active Sessions Section */}
        {earnings && earnings.recentSessions && earnings.recentSessions.filter(s => s.status === 'active').length > 0 && (
          <GlassCard className="mb-8 cursor-glow" cursorGlow>
            <h2 className="text-2xl font-bold text-white mb-6">Active Rentals & Chat</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {earnings.recentSessions
                .filter(session => session.status === 'active')
                .map((session) => (
                  <GlassCard key={session._id} className="p-5 border-primary-500/30">
                    <h3 className="text-lg font-bold text-white mb-2">Session with {session.consumer?.username || 'Client'}</h3>
                    <p className="text-white/70 text-sm mb-4">
                      GPU: {session.gpu ? session.gpu.name : 'Unknown'}<br />
                      Rate: ${session.hourlyRate}/hr
                    </p>
                    <GlassButton
                      variant="primary"
                      className="w-full"
                      onClick={() => navigate(`/sessions/${session._id}`)}
                    >
                      Open Chat & Details
                    </GlassButton>
                  </GlassCard>
                ))}
            </div>
          </GlassCard>
        )}

        <GlassCard className="cursor-glow" cursorGlow>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">My GPUs</h2>
            <GlassButton
              variant={showRegisterForm ? 'secondary' : 'primary'}
              onClick={() => setShowRegisterForm(!showRegisterForm)}
            >
              {showRegisterForm ? 'Cancel' : 'Register New GPU'}
            </GlassButton>
          </div>

          {showRegisterForm && (
            <form onSubmit={handleRegisterGPU} className="mb-8 p-6 glass-card bg-white/5 rounded-xl border border-white/10">
              <div className="space-y-5">
                <div className="relative">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    placeholder=" "
                    className="w-full px-4 py-4 rounded-xl border border-white/20 bg-white/5 backdrop-blur-md text-white placeholder-transparent focus:outline-none focus:border-primary-500/50 focus:shadow-glow-primary transition-all duration-300 z-10 relative"
                    style={{ caretColor: '#25CCF7' }}
                  />
                  <label
                    className={`absolute left-4 transition-all duration-300 pointer-events-none z-20 ${focusedField === 'name' || formData.name
                      ? 'top-2 text-xs text-primary-500'
                      : 'top-4 text-base text-white/60'
                      }`}
                  >
                    GPU Name (optional, auto-generated if empty)
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.pricePerHour}
                    onChange={(e) => setFormData({ ...formData, pricePerHour: e.target.value })}
                    onFocus={() => setFocusedField('pricePerHour')}
                    onBlur={() => setFocusedField(null)}
                    required
                    placeholder=" "
                    className="w-full px-4 py-4 rounded-xl border border-white/20 bg-white/5 backdrop-blur-md text-white placeholder-transparent focus:outline-none focus:border-primary-500/50 focus:shadow-glow-primary transition-all duration-300 z-10 relative"
                    style={{ caretColor: '#25CCF7' }}
                  />
                  <label
                    className={`absolute left-4 transition-all duration-300 pointer-events-none z-20 ${focusedField === 'pricePerHour' || formData.pricePerHour
                      ? 'top-2 text-xs text-primary-500'
                      : 'top-4 text-base text-white/60'
                      }`}
                  >
                    Price per Hour ($)
                  </label>
                </div>
                {/* Hardware Scanning Section */}
                <div className="p-4 glass-card bg-white/5 border border-white/10 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-semibold">Hardware Specifications</h4>
                    {maxVram ? (
                      <span className="text-xs bg-success-500/20 text-success-300 px-3 py-1 rounded-full border border-success-500/30">
                        Scanned Successfully
                      </span>
                    ) : (
                      <span className="text-xs bg-white/10 text-white/50 px-3 py-1 rounded-full">
                        Pending Scan
                      </span>
                    )}
                  </div>

                  {!maxVram ? (
                    <GlassButton
                      onClick={handleScanGPU}
                      type="button"
                      variant="secondary"
                      className="w-full flex justify-center items-center gap-2"
                      disabled={isScanning}
                    >
                      {isScanning ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-primary-500 border-t-transparent animate-spin"></div>
                          Scanning Hardware...
                        </>
                      ) : (
                        'Scan My PC Hardware'
                      )}
                    </GlassButton>
                  ) : (
                    <div className="space-y-4 animate-fade-in">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                          <p className="text-xs text-white/50 mb-1">Detected Manufacturer</p>
                          <p className="text-white font-medium">{formData.manufacturer}</p>
                        </div>
                        <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                          <p className="text-xs text-white/50 mb-1">Detected Model</p>
                          <p className="text-white font-medium">{formData.model}</p>
                        </div>
                      </div>

                      <div className="relative mt-2">
                        <div className="flex justify-between items-end mb-2">
                          <label className="text-sm text-white/80">VRAM to Share (GB)</label>
                          <span className="text-xs text-primary-500">Max Physical Limit: {maxVram} GB</span>
                        </div>
                        <input
                          type="number"
                          step="1"
                          min="1"
                          max={maxVram}
                          value={formData.vram}
                          onChange={(e) => setFormData({ ...formData, vram: Math.min(Math.max(1, e.target.value), maxVram) })}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/5 backdrop-blur-md text-white focus:outline-none focus:border-primary-500/50 focus:shadow-glow-primary transition-all duration-300"
                        />
                        <p className="text-xs text-white/50 mt-2">
                          How much of your physical memory do you want to allocate for client workloads? Sharing less VRAM lets you keep more for yourself while the container runs.
                        </p>
                      </div>

                      <GlassButton
                        onClick={handleScanGPU}
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="w-full mt-2"
                      >
                        Rescan Hardware
                      </GlassButton>
                    </div>
                  )}
                </div>

                <GlassButton type="submit" variant="primary" className="w-full" disabled={!maxVram}>
                  Register GPU
                </GlassButton>
              </div>
            </form>
          )}

          {gpus.length === 0 ? (
            <p className="text-white/70 text-center py-8">No GPUs registered yet. Register your first GPU to start earning!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gpus.map((gpu, index) => (
                <GlassCard
                  key={gpu._id}
                  ref={(el) => (cardsRef.current[index] = el)}
                  className="cursor-glow"
                  cursorGlow

                >
                  <h3 className="text-xl font-bold text-white mb-4">{gpu.name}</h3>
                  <div className="space-y-2 mb-5">
                    <p className="text-white/70"><strong className="text-white">Model:</strong> {gpu.manufacturer} {gpu.model}</p>
                    <p className="text-white/70"><strong className="text-white">VRAM:</strong> {gpu.vram} GB</p>
                    <p className="text-white/70"><strong className="text-white">Price:</strong> <span className="text-secondary-500 font-semibold">${gpu.pricePerHour}/hour</span></p>
                    <p className="text-white/70">
                      <strong className="text-white">Status:</strong>
                      <span className={gpu.isAvailable ? 'text-success-500 font-semibold ml-2' : 'text-red-400 font-semibold ml-2'}>
                        {gpu.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </p>
                    <p className="text-white/70"><strong className="text-white">Total Earnings:</strong> <span className="text-primary-500">${gpu.totalEarnings?.toFixed(2) || '0.00'}</span></p>
                    <p className="text-white/70"><strong className="text-white">Hours Rented:</strong> {gpu.totalHoursRented?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div className="flex gap-2">
                    <GlassButton
                      variant={gpu.isAvailable ? 'secondary' : 'success'}
                      size="sm"
                      onClick={() => handleToggleAvailability(gpu._id, gpu.isAvailable)}
                    >
                      {gpu.isAvailable ? 'Set Unavailable' : 'Set Available'}
                    </GlassButton>
                    <GlassButton
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteGPU(gpu._id)}
                    >
                      Delete
                    </GlassButton>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default ProviderDashboard;
