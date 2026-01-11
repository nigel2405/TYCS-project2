import React, { useContext, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { animatePageLoad, animateTextReveal } from '../utils/animations';
import GlassCard from '../components/common/GlassCard';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const pageRef = useRef(null);
  const headerRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    if (pageRef.current) {
      animatePageLoad(pageRef.current);
    }
    if (headerRef.current) {
      animateTextReveal(headerRef.current);
    }
    // Animate cards with stagger
    cardsRef.current.forEach((card, index) => {
      if (card) {
        setTimeout(() => animatePageLoad(card), index * 150);
      }
    });
  }, []);

  return (
    <div ref={pageRef} className="relative z-10" style={{ opacity: 0 }}>
      <div
        ref={headerRef}
        className="bg-gradient-to-r from-primary-500/20 via-secondary-500/20 to-primary-500/20 backdrop-blur-xl border-b border-white/10 py-16 mb-12 relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-5 relative z-10">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
            Welcome, {user?.username}!
          </h1>
          <p className="text-white/80 text-xl">Manage your GPU sharing activities</p>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-secondary-500/5 opacity-50" />
      </div>

      <div className="max-w-7xl mx-auto px-5 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {user?.role === 'consumer' && (
            <GlassCard
              ref={(el) => (cardsRef.current[0] = el)}
              className="cursor-glow"
              cursorGlow
              style={{ opacity: 0 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-4 rounded-xl bg-gradient-primary/20 border border-primary-500/30">
                  <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Consumer Dashboard</h2>
              <p className="text-white/70 mb-6 leading-relaxed">Browse and rent available GPUs</p>
              <Link
                to="/consumer"
                className="glass-button inline-flex items-center justify-center px-6 py-3 rounded-xl text-white font-medium bg-gradient-primary hover:shadow-glow-primary transition-all duration-300"
              >
                Go to Marketplace
              </Link>
            </GlassCard>
          )}

          {user?.role === 'provider' && (
            <GlassCard
              ref={(el) => (cardsRef.current[0] = el)}
              className="cursor-glow"
              cursorGlow
              style={{ opacity: 0 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-secondary-500/20 to-primary-500/20 border border-secondary-500/30">
                  <svg className="w-8 h-8 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Provider Dashboard</h2>
              <p className="text-white/70 mb-6 leading-relaxed">
                {user.isProviderApproved
                  ? 'Manage your GPUs and view earnings'
                  : 'Your provider account is pending approval. Once approved, you can list your GPUs.'}
              </p>
              {user.isProviderApproved && (
                <Link
                  to="/provider"
                  className="glass-button inline-flex items-center justify-center px-6 py-3 rounded-xl text-white font-medium bg-gradient-primary hover:shadow-glow-primary transition-all duration-300"
                >
                  Manage GPUs
                </Link>
              )}
            </GlassCard>
          )}

          {user?.role === 'admin' && (
            <>
              <GlassCard
                ref={(el) => (cardsRef.current[0] = el)}
                className="cursor-glow"
                cursorGlow
                style={{ opacity: 0 }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-red-500/20 to-primary-500/20 border border-red-500/30">
                    <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Admin Dashboard</h2>
                <p className="text-white/70 mb-6 leading-relaxed">Manage platform, users, and monitor activity</p>
                <Link
                  to="/admin"
                  className="glass-button inline-flex items-center justify-center px-6 py-3 rounded-xl text-white font-medium bg-gradient-primary hover:shadow-glow-primary transition-all duration-300"
                >
                  Go to Admin Panel
                </Link>
              </GlassCard>
              <GlassCard
                ref={(el) => (cardsRef.current[1] = el)}
                className="cursor-glow"
                cursorGlow
                style={{ opacity: 0 }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-4 rounded-xl bg-gradient-primary/20 border border-primary-500/30">
                    <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Browse Marketplace</h2>
                <p className="text-white/70 mb-6 leading-relaxed">View available GPUs as admin</p>
                <Link
                  to="/consumer"
                  className="glass-button inline-flex items-center justify-center px-6 py-3 rounded-xl text-white font-medium bg-gradient-to-r from-secondary-500/30 to-secondary-500/20 hover:shadow-glow-secondary transition-all duration-300"
                >
                  Go to Marketplace
                </Link>
              </GlassCard>
            </>
          )}

          <GlassCard
            ref={(el) => (cardsRef.current[cardsRef.current.length] = el)}
            className="cursor-glow gradient-border"
            cursorGlow
            style={{ opacity: 0 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-success-500/20 to-secondary-500/20 border border-success-500/30">
                <svg className="w-8 h-8 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Wallet Balance</h2>
            <p className="text-5xl font-bold mb-2 bg-gradient-to-r from-success-500 to-secondary-500 bg-clip-text text-transparent">
              ${user?.walletBalance?.toFixed(2) || '0.00'}
            </p>
            <p className="text-white/70 mb-6 leading-relaxed">Add funds to your wallet to rent GPUs</p>
            <button
              onClick={() => alert('Wallet feature coming soon!')}
              className="glass-button w-full px-6 py-3 rounded-xl text-white font-medium bg-gradient-to-r from-success-500/30 to-success-500/20 hover:shadow-lg hover:shadow-success-500/50 transition-all duration-300"
            >
              Add Funds
            </button>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
