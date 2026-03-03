import Withdrawal from '../models/Withdrawal.js';
import User from '../models/User.js';

// @desc    Request a wallet withdrawal (Provider)
// @route   POST /api/payments/withdraw
// @access  Private (Provider)
export const requestWithdrawal = async (req, res, next) => {
    try {
        const { amount, paypalEmail } = req.body;

        if (!amount || amount < 5) {
            return res.status(400).json({ success: false, message: 'Minimum withdrawal amount is $5' });
        }

        if (!paypalEmail) {
            return res.status(400).json({ success: false, message: 'PayPal email is required' });
        }

        const user = await User.findById(req.user.id);

        // Check if provider has enough funds. Assuming 1 USD = 85 INR, convert $5 requirement
        const amountInr = amount * 85;

        if (user.walletBalance < amountInr) {
            return res.status(400).json({
                success: false,
                message: `Insufficient funds. You have ₹${user.walletBalance}, requested ₹${amountInr}`
            });
        }

        // Optional: Prevent multiple pending requests
        const pendingRequest = await Withdrawal.findOne({ provider: user._id, status: 'pending' });
        if (pendingRequest) {
            return res.status(400).json({ success: false, message: 'You already have a pending withdrawal request.' });
        }

        const withdrawal = await Withdrawal.create({
            provider: user._id,
            amount: amount, // Storing in USD
            paypalEmail
        });

        res.status(201).json({
            success: true,
            message: 'Withdrawal request submitted successfully',
            data: { withdrawal }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get my withdrawal history
// @route   GET /api/payments/withdrawals
// @access  Private
export const getMyWithdrawals = async (req, res, next) => {
    try {
        const withdrawals = await Withdrawal.find({ provider: req.user.id }).sort('-createdAt');

        res.status(200).json({
            success: true,
            count: withdrawals.length,
            data: { withdrawals }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all withdrawal requests (Admin)
// @route   GET /api/admin/withdrawals
// @access  Private/Admin
export const getAllWithdrawals = async (req, res, next) => {
    try {
        const withdrawals = await Withdrawal.find()
            .populate('provider', 'username email walletBalance')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: withdrawals.length,
            data: { withdrawals }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Process a withdrawal request (Admin)
// @route   PUT /api/admin/withdrawals/:id
// @access  Private/Admin
export const processWithdrawal = async (req, res, next) => {
    try {
        const { status, transactionId, adminNotes } = req.body;

        const withdrawal = await Withdrawal.findById(req.params.id).populate('provider');

        if (!withdrawal) {
            return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
        }

        if (withdrawal.status !== 'pending' && withdrawal.status !== 'processing') {
            return res.status(400).json({ success: false, message: `Cannot process a ${withdrawal.status} request` });
        }

        // If marking as completed, actually deduct from the provider's wallet balance
        if (status === 'completed') {
            const user = await User.findById(withdrawal.provider._id);
            const amountInRate = withdrawal.amount * 85;

            if (user.walletBalance < amountInRate) {
                return res.status(400).json({ success: false, message: 'Provider no longer has sufficient funds for this payout.' });
            }

            user.walletBalance -= amountInRate;
            await user.save();
        }

        withdrawal.status = status;
        if (transactionId) withdrawal.transactionId = transactionId;
        if (adminNotes) withdrawal.adminNotes = adminNotes;

        await withdrawal.save();

        res.status(200).json({
            success: true,
            message: `Withdrawal marked as ${status}`,
            data: { withdrawal }
        });

    } catch (error) {
        next(error);
    }
};
