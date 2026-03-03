import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from '../../services/api';
import { animatePageLoad } from '../../utils/animations';
import GlassCard from '../../components/common/GlassCard';
import GlassButton from '../../components/common/GlassButton';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [focusedField, setFocusedField] = useState(null);

    const { resettoken } = useParams();
    const navigate = useNavigate();
    const formRef = useRef(null);

    useEffect(() => {
        if (formRef.current) {
            animatePageLoad(formRef.current);
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            return setError("Passwords do not match");
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const res = await axios.put(`/auth/resetpassword/${resettoken}`, { password });
            setSuccess(res.data.message);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
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
                            Create New Password
                        </h1>
                        <p className="text-white/60">
                            Your new password must be securely hashed and stored.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 rounded-xl bg-success-500/10 border border-success-500/20 text-success-400 text-sm text-center">
                            {success} <br /> Redirecting to login...
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative">
                            <input
                                type="password"
                                required
                                minLength="6"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                                placeholder=" "
                                className="w-full px-4 py-4 rounded-xl border border-white/20 bg-white/5 backdrop-blur-md text-white placeholder-transparent focus:outline-none focus:border-primary-500/50 focus:shadow-glow-primary transition-all duration-300 z-10 relative"
                                style={{ caretColor: '#25CCF7' }}
                            />
                            <label
                                className={`absolute left-4 transition-all duration-300 pointer-events-none z-20 ${focusedField === 'password' || password
                                        ? 'top-2 text-xs text-primary-500'
                                        : 'top-4 text-base text-white/60'
                                    }`}
                            >
                                New Password
                            </label>
                        </div>

                        <div className="relative">
                            <input
                                type="password"
                                required
                                minLength="6"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                onFocus={() => setFocusedField('confirmPassword')}
                                onBlur={() => setFocusedField(null)}
                                placeholder=" "
                                className="w-full px-4 py-4 rounded-xl border border-white/20 bg-white/5 backdrop-blur-md text-white placeholder-transparent focus:outline-none focus:border-primary-500/50 focus:shadow-glow-primary transition-all duration-300 z-10 relative"
                                style={{ caretColor: '#25CCF7' }}
                            />
                            <label
                                className={`absolute left-4 transition-all duration-300 pointer-events-none z-20 ${focusedField === 'confirmPassword' || confirmPassword
                                        ? 'top-2 text-xs text-primary-500'
                                        : 'top-4 text-base text-white/60'
                                    }`}
                            >
                                Confirm New Password
                            </label>
                        </div>

                        <GlassButton
                            type="submit"
                            variant="primary"
                            className="w-full py-4 text-lg font-bold"
                            disabled={loading || success}
                        >
                            {loading ? 'Processing...' : 'Reset Password'}
                        </GlassButton>
                    </form>

                    <div className="mt-8 text-center text-white/60">
                        <Link
                            to="/login"
                            className="text-primary-400 hover:text-primary-300 font-semibold transition-colors"
                        >
                            Back to Login
                        </Link>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};

export default ResetPassword;
