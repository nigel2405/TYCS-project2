import React, { useState, useEffect } from 'react';
import axios from '../services/api';
import { FiDollarSign, FiCheck, FiX, FiClock } from 'react-icons/fi';
import GlassCard from '../components/common/GlassCard';

const AdminWithdrawals = () => {
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchWithdrawals();
    }, []);

    const fetchWithdrawals = async () => {
        try {
            const res = await axios.get('/admin/withdrawals');
            setWithdrawals(res.data.data.withdrawals);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch withdrawals');
        } finally {
            setLoading(false);
        }
    };

    const handleProcess = async (id, status) => {
        if (!window.confirm(`Are you sure you want to mark this as ${status}?`)) return;

        setProcessingId(id);
        try {
            const payload = { status };
            if (status === 'completed') {
                const transactionId = window.prompt("Enter the PayPal Transaction ID:");
                if (!transactionId) {
                    setProcessingId(null);
                    return;
                }
                payload.transactionId = transactionId;
            }

            await axios.put(`/admin/withdrawals/${id}`, payload);
            fetchWithdrawals(); // Refresh list
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to process request');
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
            case 'processing': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            case 'completed': return 'text-green-400 bg-green-400/10 border-green-400/20';
            case 'rejected': return 'text-red-400 bg-red-400/10 border-red-400/20';
            default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
        }
    };

    if (loading) return <div className="p-6 text-white text-center animate-pulse">Loading requests...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <FiDollarSign className="text-primary-500" />
                    Payout Requests
                </h1>
                <div className="px-4 py-2 bg-primary-500/20 text-primary-300 rounded-lg text-sm font-medium border border-primary-500/30">
                    {withdrawals.filter(w => w.status === 'pending').length} Pending
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                    {error}
                </div>
            )}

            {withdrawals.length === 0 ? (
                <GlassCard className="text-center py-12">
                    <p className="text-white/60">No withdrawal requests found.</p>
                </GlassCard>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {withdrawals.map((withdrawal) => (
                        <GlassCard key={withdrawal._id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:bg-white/5 border-white/10">
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-lg font-bold text-white">${withdrawal.amount.toFixed(2)}</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border uppercase tracking-wider ${getStatusColor(withdrawal.status)}`}>
                                        {withdrawal.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm text-white/70">
                                    <div className="space-y-1">
                                        <p><strong className="text-white/90">Provider:</strong> {withdrawal.provider?.username || 'Unknown'}</p>
                                        <p><strong className="text-white/90">PayPal Email:</strong> <span className="text-primary-400">{withdrawal.paypalEmail}</span></p>
                                    </div>
                                    <div className="space-y-1">
                                        <p><strong className="text-white/90">Requested:</strong> {new Date(withdrawal.createdAt).toLocaleDateString()}</p>
                                        <p><strong className="text-white/90">Wallet Balance:</strong> ₹{withdrawal.provider?.walletBalance || 0}</p>
                                    </div>
                                </div>

                                {withdrawal.transactionId && (
                                    <p className="text-sm text-green-400/90 mt-2 bg-green-400/10 p-2 rounded border border-green-400/20 inline-block">
                                        <strong>Txn ID:</strong> {withdrawal.transactionId}
                                    </p>
                                )}
                            </div>

                            {(withdrawal.status === 'pending' || withdrawal.status === 'processing') && (
                                <div className="flex flex-wrap gap-2 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t border-white/10 md:border-t-0">
                                    {withdrawal.status === 'pending' && (
                                        <button
                                            onClick={() => handleProcess(withdrawal._id, 'processing')}
                                            disabled={processingId === withdrawal._id}
                                            className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/50 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 flex-1 md:flex-none disabled:opacity-50"
                                        >
                                            <FiClock /> Process
                                        </button>
                                    )}

                                    <button
                                        onClick={() => handleProcess(withdrawal._id, 'completed')}
                                        disabled={processingId === withdrawal._id}
                                        className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 flex-1 md:flex-none disabled:opacity-50"
                                    >
                                        <FiCheck /> Mark Paid
                                    </button>

                                    <button
                                        onClick={() => handleProcess(withdrawal._id, 'rejected')}
                                        disabled={processingId === withdrawal._id}
                                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 flex-1 md:flex-none disabled:opacity-50"
                                    >
                                        <FiX /> Reject
                                    </button>
                                </div>
                            )}
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminWithdrawals;
