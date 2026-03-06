import React, { useContext, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';
import { animatePageLoad, animateUnderline, animateButtonRipple } from '../../utils/animations';

const Navbar = () => {
  const { user, logout, isAuthenticated, checkAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef(null);
  const linkRefs = useRef({});

  useEffect(() => {
    if (navRef.current) {
      animatePageLoad(navRef.current);
    }
  }, []);

  useEffect(() => {
    // Animate active link underline
    Object.keys(linkRefs.current).forEach((path) => {
      if (linkRefs.current[path]) {
        animateUnderline(linkRefs.current[path], location.pathname === path);
      }
    });
  }, [location.pathname]);

  const handleLogout = (e) => {
    animateButtonRipple(e.currentTarget, e);
    setTimeout(() => {
      logout();
      navigate('/login');
    }, 300);
  };

  const handleAddFunds = () => {
    navigate('/add-funds');
  };

  const NavLink = ({ to, children, className = '' }) => (
    <Link
      ref={(el) => (linkRefs.current[to] = el)}
      to={to}
      className={`relative px-4 py-2 text-white/90 font-medium no-underline transition-colors duration-300 hover:text-white group ${className}`}
    >
      {children}
      <span
        className="underline absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 origin-left"
        style={{ transform: 'scaleX(0)' }}
      />
    </Link>
  );

  return (
    <nav
      ref={navRef}
      className="glass-dark fixed top-0 left-0 right-0 z-50 h-[72px] border-b border-white/5 shadow-premium"
    >
      <div className="max-w-7xl mx-auto px-6 h-full">
        <div className="flex justify-between items-center h-full">
          <Link
            to="/"
            className="text-2xl font-display font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent no-underline tracking-tight hover:scale-105 transition-transform duration-300"
          >
            GPU Sharing Platform
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <NavLink to="/">Dashboard</NavLink>

              {user?.role === 'provider' && <NavLink to="/provider">Provider</NavLink>}

              {user?.role === 'consumer' && (
                <>
                  <NavLink to="/consumer">Marketplace</NavLink>
                  <NavLink to="/consumer/billing">Billing</NavLink>
                </>
              )}

              {user?.role === 'admin' && (
                <>
                  <NavLink to="/admin">Admin</NavLink>
                  <NavLink to="/consumer">Marketplace</NavLink>
                </>
              )}

              <div className="flex items-center gap-4 pl-6 ml-6 border-l border-white/20">
                <div className="flex flex-col items-end">
                  <Link to="/profile" className="font-semibold text-white text-sm hover:text-primary-500 transition-colors">
                    {user?.username}
                  </Link>
                  <span className="text-white/60 text-xs capitalize">{user?.role}</span>
                </div>
                {user?.role === 'provider' ? (
                  <div className="glass-card px-4 py-2 rounded-lg border border-primary-500/30">
                    <span className="text-secondary-500 font-bold text-sm">
                      ${user?.walletBalance?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                ) : (
                  <div
                    onClick={handleAddFunds}
                    className="glass-card px-4 py-2 rounded-lg border border-primary-500/30 cursor-pointer hover:bg-white/10 transition-colors"
                    title="Click to add funds"
                  >
                    <span className="text-secondary-500 font-bold text-sm">
                      ${user?.walletBalance?.toFixed(2) || '0.00'}
                    </span>
                    <span className="ml-2 text-xs text-white/50">+</span>
                  </div>
                )}

                <button
                  onClick={handleLogout}
                  className="glass-button px-4 py-2 rounded-lg text-white text-sm font-medium hover:shadow-glow-primary transition-all duration-300 relative overflow-hidden"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <NavLink to="/login">Login</NavLink>
              <Link
                to="/register"
                className="glass-button px-6 py-2 rounded-lg text-white text-sm font-medium bg-gradient-primary hover:shadow-glow-primary transition-all duration-300 relative overflow-hidden"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
