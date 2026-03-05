import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import axios from '../services/api';
import { animatePageLoad } from '../utils/animations';
import GlassCard from '../components/common/GlassCard';
import GlassButton from '../components/common/GlassButton';
import PageHeader from '../components/common/PageHeader';

const UserProfile = () => {
    const { user, checkAuth } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        avatar: '',
        password: '',
        confirmPassword: ''
    });

    const pageRef = useRef(null);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                firstName: user.profile?.firstName || '',
                lastName: user.profile?.lastName || '',
                avatar: user.profile?.avatar || '',
            }));
        }
    }, [user]);

    useEffect(() => {
        if (pageRef.current) {
            animatePageLoad(pageRef.current);
        }
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (formData.password && formData.password !== formData.confirmPassword) {
            setError("Passwords don't match");
            setLoading(false);
            return;
        }

        try {
            const payload = {
                profile: {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    avatar: formData.avatar,
                }
            };

            if (formData.password) {
                payload.password = formData.password;
            }

            await axios.put('/auth/profile', payload);
            await checkAuth(); // Refresh context
            setSuccess('Profile updated successfully!');
            setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div ref={pageRef} className="relative z-10" >
            <PageHeader title="User Profile" subtitle="Manage your account settings" />

            <div className="max-w-4xl mx-auto px-5 pb-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Sidebar / Avatar Card */}
                    <div className="md:col-span-1">
                        <GlassCard className="text-center p-6 bg-gradient-to-b from-primary-500/10 to-transparent">
                            <div className="w-32 h-32 mx-auto rounded-full bg-white/10 flex items-center justify-center overflow-hidden mb-4 border-2 border-primary-500/50 shadow-glow-primary">
                                {formData.avatar ? (
                                    <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl text-white/50">{user?.username?.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1">{user?.username}</h3>
                            <p className="text-white/60 text-sm mb-4 capitalize">{user?.role}</p>
                            <div className="glass-card bg-white/5 p-3 rounded-lg">
                                <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Wallet Balance</p>
                                <p className="text-xl font-bold text-secondary-500">₹{user?.walletBalance?.toFixed(2)}</p>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Form Card */}
                    <div className="md:col-span-2">
                        <GlassCard className="cursor-glow" cursorGlow>
                            <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Edit Profile</h2>

                            {error && (
                                <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="bg-green-500/20 border border-green-500/50 text-green-200 px-4 py-3 rounded-lg mb-6">
                                    {success}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm text-white/70 mb-2">First Name</label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/5 text-white focus:outline-none focus:border-primary-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-white/70 mb-2">Last Name</label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/5 text-white focus:outline-none focus:border-primary-500 transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-white/70 mb-2">Avatar URL</label>
                                    <input
                                        type="text"
                                        name="avatar"
                                        value={formData.avatar}
                                        onChange={handleChange}
                                        placeholder="https://example.com/avatar.jpg"
                                        className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/5 text-white focus:outline-none focus:border-primary-500 transition-colors"
                                    />
                                </div>

                                <div className="pt-6 border-t border-white/10">
                                    <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm text-white/70 mb-2">New Password (optional)</label>
                                            <input
                                                type="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/5 text-white focus:outline-none focus:border-primary-500 transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-white/70 mb-2">Confirm Password</label>
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/5 text-white focus:outline-none focus:border-primary-500 transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <GlassButton type="submit" variant="primary" disabled={loading}>
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </GlassButton>
                                </div>
                            </form>
                        </GlassCard>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
