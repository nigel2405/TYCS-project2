import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../services/api';
import { animatePageLoad } from '../../utils/animations';
import GlassCard from '../../components/common/GlassCard';
import GlassButton from '../../components/common/GlassButton';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [focusedField, setFocusedField] = useState(null);

    const formRef = useRef(null);

    useEffect(() => {
        if (formRef.current) {
            animatePageLoad(formRef.current);
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await axios.post('/auth/forgotpassword', { email });
            setSuccess('An email has been sent with further instructions.');
            setEmail('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh] px-5 relative z-10">
            <div className="w-full max-w-md">
                <GlassCard ref={formRef} className="p-8 cursor-glow" cursorGlow >
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                            Reset Password
                        </h1>
                        <p className="text-white/60">
                            Enter your email and we will send you a link to get back into your account.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 rounded-xl bg-success-500/10 border border-success-500/20 text-success-400 text-sm text-center">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative">
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                                placeholder=" "
                                className="w-full px-4 py-4 rounded-xl border border-white/20 bg-white/5 backdrop-blur-md text-white placeholder-transparent focus:outline-none focus:border-primary-500/50 focus:shadow-glow-primary transition-all duration-300 z-10 relative"
                                style={{ caretColor: '#25CCF7' }}
                            />
                            <label
                                className={`absolute left-4 transition-all duration-300 pointer-events-none z-20 ${focusedField === 'email' || email
                                        ? 'top-2 text-xs text-primary-500'
                                        : 'top-4 text-base text-white/60'
                                    }`}
                            >
                                Email Address
                            </label>
                        </div>

                        <GlassButton
                            type="submit"
                            variant="primary"
                            className="w-full py-4 text-lg font-bold"
                            disabled={loading}
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </GlassButton>
                    </form>

                    <div className="mt-8 text-center text-white/60">
                        Remember your password?{' '}
                        <Link
                            to="/login"
                            className="text-primary-400 hover:text-primary-300 font-semibold transition-colors"
                        >
                            Log in
                        </Link>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};

export default ForgotPassword;
