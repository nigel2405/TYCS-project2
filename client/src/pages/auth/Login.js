import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { animatePageLoad, animateTextReveal } from '../../utils/animations';
import GlassCard from '../../components/common/GlassCard';
import GlassButton from '../../components/common/GlassButton';
import FloatingBlobs from '../../components/common/FloatingBlobs';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const { login, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (containerRef.current) {
      animatePageLoad(containerRef.current);
    }
    if (titleRef.current) {
      animateTextReveal(titleRef.current);
    }
    if (formRef.current) {
      setTimeout(() => animateTextReveal(formRef.current), 200);
    }
  }, []);

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData.email, formData.password);

    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 relative overflow-hidden">
      <FloatingBlobs />
      <div
        ref={containerRef}
        className="relative z-10 w-full max-w-md"
        style={{ opacity: 0 }}
      >
        <GlassCard className="p-10 cursor-glow" cursorGlow>
          <div ref={titleRef} className="mb-8">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-white/70 text-lg">Sign in to your account</p>
          </div>

          {error && (
            <div className="glass-card bg-red-500/20 border-red-500/50 p-4 rounded-xl mb-6">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form ref={formRef} onSubmit={onSubmit} className="space-y-6">
            <div className="relative">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={onChange}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                required
                placeholder=" "
                className="w-full px-4 py-4 rounded-xl border border-white/20 bg-white/5 backdrop-blur-md text-white placeholder-transparent focus:outline-none focus:border-primary-500/50 focus:shadow-glow-primary transition-all duration-300 z-10 relative"
                style={{ caretColor: '#25CCF7' }}
              />
              <label
                htmlFor="email"
                className={`absolute left-4 transition-all duration-300 pointer-events-none z-20 ${
                  focusedField === 'email' || formData.email
                    ? 'top-2 text-xs text-primary-500'
                    : 'top-4 text-base text-white/60'
                }`}
              >
                Email Address
              </label>
            </div>

            <div className="relative">
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={onChange}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                required
                placeholder=" "
                minLength="6"
                className="w-full px-4 py-4 rounded-xl border border-white/20 bg-white/5 backdrop-blur-md text-white placeholder-transparent focus:outline-none focus:border-primary-500/50 focus:shadow-glow-primary transition-all duration-300 z-10 relative"
                style={{ caretColor: '#25CCF7' }}
              />
              <label
                htmlFor="password"
                className={`absolute left-4 transition-all duration-300 pointer-events-none z-20 ${
                  focusedField === 'password' || formData.password
                    ? 'top-2 text-xs text-primary-500'
                    : 'top-4 text-base text-white/60'
                }`}
              >
                Password
              </label>
            </div>

            <GlassButton
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Logging in...' : 'Login'}
            </GlassButton>
          </form>

          <p className="text-center mt-6 text-white/70">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-primary-500 font-medium hover:text-secondary-500 transition-colors duration-300 underline decoration-primary-500/50 hover:decoration-secondary-500"
            >
              Register here
            </Link>
          </p>
        </GlassCard>
      </div>
    </div>
  );
};

export default Login;
