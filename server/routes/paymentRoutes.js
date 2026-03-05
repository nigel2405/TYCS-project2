import express from 'express';
import paypal from '@paypal/checkout-server-sdk';
import { client } from '../config/paypal.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { requestWithdrawal, getMyWithdrawals } from '../controllers/paymentController.js';

const router = express.Router();

// @desc    Create PayPal Order
// @route   POST /api/payments/create-order
// @access  Private
router.post('/create-order', protect, async (req, res) => {
    const { amount } = req.body; // Amount in INR

    if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    // Convert INR to USD (Approximate, strictly for PayPal sandbox if it doesn't support INR directly in some modes, but usually it does. 
    // For simplicity, we will request standard USD for now or try INR if account supports it. 
    // PayPal Sandbox often requires USD key. Let's stick to USD for the API call but treating 1 unit as 1 INR visually in frontend if we want, OR better:
    // actually convert. Let's assume 1 USD = 85 INR for simplicity if we MUST use USD, OR try INR.
    // Standard PayPal accounts support INR. Let's try 'INR'.

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
        intent: 'CAPTURE',
        application_context: {
            return_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment-success`,
            cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/add-funds`
        },
        purchase_units: [{
            amount: {
                currency_code: 'INR',
                value: parseFloat(amount).toFixed(2) // Charge the exact requested amount in INR
            }
        }]
    });

    try {
        const order = await client.execute(request);
        res.json({ success: true, id: order.result.id });
    } catch (err) {
        console.error('PayPal Create Order Error:', err);
        res.status(500).json({ success: false, message: 'Payment creation failed' });
    }
});

// @desc    Capture PayPal Order (Success)
// @route   POST /api/payments/capture-order
// @access  Private
router.post('/capture-order', protect, async (req, res) => {
    const { orderId, amountInr } = req.body;

    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    try {
        const capture = await client.execute(request);

        // Create 'capture' object is complex, check status
        if (capture.result.status === 'COMPLETED') {
            // Update User Wallet
            const user = await User.findById(req.user._id);
            if (user) {
                try {
                    // Extract the actual captured USD amount from PayPal's response
                    const paidUsd = parseFloat(capture.result.purchase_units[0].payments.captures[0].amount.value);
                    const creditedAmount = Math.round(paidUsd); // Add the USD value

                    user.walletBalance = (user.walletBalance || 0) + creditedAmount;
                    await user.save();
                    return res.json({ success: true, walletBalance: user.walletBalance });
                } catch (parseError) {
                    console.error('Error parsing capture amount:', parseError);
                    // Fallback if the amount structure is nested differently
                    user.walletBalance = (user.walletBalance || 0) + Number(amountInr || 0);
                    await user.save();
                    return res.json({ success: true, walletBalance: user.walletBalance, warning: 'Fallback amount padding used.' });
                }
            } else {
                res.status(404).json({ success: false, message: 'User not found' });
            }
        } else {
            res.status(400).json({ success: false, message: 'Payment not completed' });
        }

    } catch (err) {
        console.error('PayPal Capture Error:', err);
        res.status(500).json({ success: false, message: 'Payment capture failed' });
    }
});

router.post('/withdraw', protect, requestWithdrawal);
router.get('/withdrawals', protect, getMyWithdrawals);

export default router;
