import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/api';
import { animatePageLoad } from '../../utils/animations';
import GlassCard from '../../components/common/GlassCard';
import GlassButton from '../../components/common/GlassButton';
import PageHeader from '../../components/common/PageHeader';

const AddFunds = () => {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const pageRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (pageRef.current) {
            animatePageLoad(pageRef.current);
        }
    }, []);

    const handlePayment = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Create Order
            const res = await axios.post('/payments/create-order', { amount });

            if (res.data.success) {
                // 2. Redirect to PayPal
                // In a real implementation with valid client ID, we'd get an approve link.
                // For sandbox with this SDK, we might need to handle the approval flow differently 
                // or use the older `paypal-rest-sdk` which returned links directly.
                // The `@paypal/checkout-server-sdk` returns an order ID.
                // To approve, we typically use the PayPal JS SDK on the frontend or redirect to:
                // https://www.sandbox.paypal.com/checkoutnow?token=ORDER_ID

                window.location.href = `https://www.sandbox.paypal.com/checkoutnow?token=${res.data.id}`;
            } else {
                setError('Failed to initiate payment.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Payment failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div ref={pageRef} className="relative z-10" >
            <PageHeader title="Add Funds" subtitle="Top up your wallet with PayPal" />

            <div className="max-w-md mx-auto px-5">
                <GlassCard className="cursor-glow" cursorGlow>
                    <form onSubmit={handlePayment} className="space-y-6">
                        <div>
                            <label className="block text-sm text-white/70 mb-2">Amount (₹)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-3.5 text-white/50">₹</span>
                                <input
                                    type="number"
                                    min="1"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/20 bg-white/5 text-white focus:outline-none focus:border-primary-500 transition-colors"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                                {error}
                            </div>
                        )}

                        <GlassButton
                            type="submit"
                            variant="primary"
                            className="w-full flex justify-center items-center gap-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <span>Pay with</span>
                                    <span className="font-bold italic">PayPal</span>
                                </>
                            )}
                        </GlassButton>
                    </form>
                </GlassCard>
            </div>
        </div>
    );
};

export default AddFunds;
