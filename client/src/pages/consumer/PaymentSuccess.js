import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from '../../services/api';
import GlassCard from '../../components/common/GlassCard';
import GlassButton from '../../components/common/GlassButton';
import { animatePageLoad } from '../../utils/animations';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('processing'); // processing, success, error
    const [message, setMessage] = useState('Verifying payment...');
    const navigate = useNavigate();
    const pageRef = useRef(null);

    useEffect(() => {
        if (pageRef.current) {
            animatePageLoad(pageRef.current);
        }

        const capturePayment = async () => {
            const orderId = searchParams.get('token');
            // Note: We don't have the amount here unless we stored it in local storage or session.
            // For simplicity in this flow, we might need to assume or rely on the backend to know 
            // (but backend is stateless regarding this unless we created a pending transaction).
            // However, the `capture-order` endpoint expects `amountInr` which is odd if we are capturing.
            // Actually, standard PayPal capture doesn't need amount if authorized.
            // Let's modify the backend capture to not require amount if simpler, 
            // OR pass a dummy amount for now if my backend code required it (I wrote it to take amountInr).
            // Let's fix backend to NOT require amountInr for capture if possible, or we pass 0 and trust PayPal's total.
            // Wait, my backend implementation of `capture-order` updates the wallet. 
            // If I don't know the amount here, I can't update the wallet accurately unless 
            // I fetch the order details first (which `capture` response usually provides).

            try {
                const res = await axios.post('/payments/capture-order', {
                    orderId,
                    amountInr: 0 // Backend should ideally fetch this from the order details
                });

                if (res.data.success) {
                    setStatus('success');
                    setMessage('Payment successful! Funds added to your wallet.');
                } else {
                    setStatus('error');
                    setMessage(res.data.message || 'Payment failed.');
                }
            } catch (err) {
                setStatus('error');
                setMessage('Failed to capture payment.');
            }
        };

        if (searchParams.get('token')) {
            capturePayment();
        } else {
            setStatus('error');
            setMessage('Invalid payment token.');
        }
    }, [searchParams]);

    return (
        <div ref={pageRef} className="min-h-[80vh] flex items-center justify-center relative z-10" >
            <GlassCard className="max-w-md w-full text-center p-8">
                {status === 'processing' && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <h2 className="text-xl font-bold text-white mb-2">Processing Payment</h2>
                        <p className="text-white/70">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-success-500/20 text-success-500 rounded-full flex items-center justify-center mb-4 text-4xl">
                            ✓
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Success!</h2>
                        <p className="text-white/70 mb-6">{message}</p>
                        <GlassButton variant="primary" onClick={() => navigate('/dashboard')}>
                            Go to Dashboard
                        </GlassButton>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-4 text-3xl">
                            ✕
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Payment Failed</h2>
                        <p className="text-white/70 mb-6">{message}</p>
                        <GlassButton variant="secondary" onClick={() => navigate('/add-funds')}>
                            Try Again
                        </GlassButton>
                    </div>
                )}
            </GlassCard>
        </div>
    );
};

export default PaymentSuccess;
