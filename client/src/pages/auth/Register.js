import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { animatePageLoad, animateTextReveal } from '../../utils/animations';
import GlassCard from '../../components/common/GlassCard';
import GlassButton from '../../components/common/GlassButton';
import FloatingBlobs from '../../components/common/FloatingBlobs';

/* ===============================
   FLOATING INPUT (OUTSIDE!)
================================ */
const FloatingLabelInput = ({
  id,
  name,
  type = 'text',
  label,
  value,
  minLength,
  required,
  onChange,
  focusedField,
  setFocusedField,
}) => (
  <div className="relative">
    <input
      id={id}
      name={name}
      type={type}
      value={value}
      minLength={minLength}
      required={required}
      onChange={onChange}
      onFocus={() => setFocusedField(name)}
      onBlur={() => setFocusedField(null)}
      placeholder=" "
      autoComplete="off"
      className="w-full px-4 py-4 rounded-xl border border-white/20 bg-white/5 backdrop-blur-md
                 text-white placeholder-transparent focus:outline-none
                 focus:border-primary-500/50 focus:shadow-glow-primary
                 transition-all duration-300"
      style={{ caretColor: '#25CCF7' }}
    />

    <label
      htmlFor={id}
      className={`absolute left-4 transition-all duration-300 pointer-events-none
        ${focusedField === name || value
          ? 'top-2 text-xs text-primary-500'
          : 'top-4 text-base text-white/60'}`}
    >
      {label}
    </label>
  </div>
);

/* ===============================
   REGISTER PAGE
================================ */
const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'consumer',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const { register, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const containerRef = useRef(null);
  const titleRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (containerRef.current) animatePageLoad(containerRef.current);
    if (titleRef.current) animateTextReveal(titleRef.current);
  }, []);

  const onChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const result = await register({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      role: formData.role,
    });

    setLoading(false);

    if (result?.success) navigate('/');
    else setError(result?.error || 'Registration failed');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 relative overflow-hidden">
      <FloatingBlobs />

      <div ref={containerRef} className="relative z-10 w-full max-w-md opacity-0">
        <GlassCard className="p-10 cursor-glow" cursorGlow>
          <div ref={titleRef} className="mb-8">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
              Create Account
            </h1>
            <p className="text-white/70 text-lg">
              Join the GPU sharing platform
            </p>
          </div>

          {error && (
            <div className="glass-card bg-red-500/20 border-red-500/50 p-4 rounded-xl mb-6">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
            <FloatingLabelInput
              id="username"
              name="username"
              label="Username"
              value={formData.username}
              minLength={3}
              required
              onChange={onChange}
              focusedField={focusedField}
              setFocusedField={setFocusedField}
            />

            <FloatingLabelInput
              id="email"
              name="email"
              type="email"
              label="Email Address"
              value={formData.email}
              required
              onChange={onChange}
              focusedField={focusedField}
              setFocusedField={setFocusedField}
            />

            <div className="relative">
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={onChange}
                onFocus={() => setFocusedField('role')}
                onBlur={() => setFocusedField(null)}
                className="w-full px-4 py-4 rounded-xl border border-white/20 bg-white/5 backdrop-blur-md
                           text-white focus:outline-none focus:border-primary-500/50
                           focus:shadow-glow-primary transition-all duration-300 appearance-none"
              >
                <option value="consumer" className="bg-gray-900">
                  Consumer (Rent GPUs)
                </option>
                <option value="provider" className="bg-gray-900">
                  Provider (Share GPUs)
                </option>
              </select>

              <label
                htmlFor="role"
                className={`absolute left-4 transition-all duration-300 pointer-events-none
                  ${focusedField === 'role'
                    ? 'top-2 text-xs text-primary-500'
                    : 'top-4 text-base text-white/60'}`}
              >
                Account Type
              </label>
            </div>

            <FloatingLabelInput
              id="password"
              name="password"
              type="password"
              label="Password"
              value={formData.password}
              minLength={6}
              required
              onChange={onChange}
              focusedField={focusedField}
              setFocusedField={setFocusedField}
            />

            <FloatingLabelInput
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              label="Confirm Password"
              value={formData.confirmPassword}
              minLength={6}
              required
              onChange={onChange}
              focusedField={focusedField}
              setFocusedField={setFocusedField}
            />

            <GlassButton
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Registering...' : 'Register'}
            </GlassButton>
          </form>

          <p className="text-center mt-6 text-white/70">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-500 font-medium underline">
              Login here
            </Link>
          </p>
        </GlassCard>
      </div>
    </div>
  );
};

export default Register;
