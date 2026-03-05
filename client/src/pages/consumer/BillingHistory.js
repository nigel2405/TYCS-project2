import React, { useState, useEffect, useRef } from 'react';
import axios from '../../services/api';
import { animatePageLoad } from '../../utils/animations';
import GlassCard from '../../components/common/GlassCard';
import GlassButton from '../../components/common/GlassButton';
import PageHeader from '../../components/common/PageHeader';
import SkeletonLoader from '../../components/common/SkeletonLoader';

const BillingHistory = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const pageRef = useRef(null);

    useEffect(() => {
        fetchBillingHistory();
    }, []);

    useEffect(() => {
        if (pageRef.current) {
            animatePageLoad(pageRef.current);
        }
    }, [sessions]);

    const fetchBillingHistory = async () => {
        try {
            // Fetch completed sessions acting as "invoices"
            const res = await axios.get('/consumer/sessions', {
                params: { status: 'completed', limit: 50 }
            });
            setSessions(res.data.data.sessions || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch billing history');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadInvoice = (sessionId) => {
        // Mock download functionality
        alert(`Downloading invoice for session #${sessionId.slice(-6)}...`);
    };

    if (loading) {
        return (
            <div className="relative z-10">
                <PageHeader title="Billing History" subtitle="View your past transactions and invoices" />
                <div className="max-w-7xl mx-auto px-5">
                    <SkeletonLoader className="h-96" />
                </div>
            </div>
        );
    }

    return (
        <div ref={pageRef} className="relative z-10" >
            <PageHeader title="Billing History" subtitle="View your past transactions and invoices" />

            <div className="max-w-7xl mx-auto px-5 pb-12">
                {error && (
                    <div className="glass-card bg-red-500/20 border-red-500/50 p-4 rounded-xl mb-6">
                        <p className="text-red-300 text-sm">{error}</p>
                    </div>
                )}

                <GlassCard className="cursor-glow" cursorGlow>
                    {sessions.length === 0 ? (
                        <p className="text-white/70 text-center py-8">No billing history found.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="glass-card bg-white/5">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-white border-b border-white/10">Date</th>
                                        <th className="px-4 py-3 text-left font-semibold text-white border-b border-white/10">Description</th>
                                        <th className="px-4 py-3 text-left font-semibold text-white border-b border-white/10">Duration</th>
                                        <th className="px-4 py-3 text-left font-semibold text-white border-b border-white/10">Rate</th>
                                        <th className="px-4 py-3 text-left font-semibold text-white border-b border-white/10">Total</th>
                                        <th className="px-4 py-3 text-left font-semibold text-white border-b border-white/10">Invoice</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sessions.map((session) => (
                                        <tr key={session._id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 text-white/90">
                                                {new Date(session.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 text-white/90">
                                                Rental: {session.gpu?.name || 'Unknown GPU'}
                                                <div className="text-xs text-white/50">{session._id}</div>
                                            </td>
                                            <td className="px-4 py-3 text-white/70">
                                                {Math.round((session.duration || 0) / 60)}h {Math.round((session.duration || 0) % 60)}m
                                            </td>
                                            <td className="px-4 py-3 text-white/70">
                                                ${session.hourlyRate}/hr
                                            </td>
                                            <td className="px-4 py-3 text-secondary-500 font-bold">
                                                ${session.totalCost?.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <GlassButton
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleDownloadInvoice(session._id)}
                                                >
                                                    Download
                                                </GlassButton>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </GlassCard>
            </div>
        </div>
    );
};

export default BillingHistory;
