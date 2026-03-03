import mongoose from 'mongoose';

const withdrawalSchema = new mongoose.Schema(
    {
        provider: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        amount: {
            type: Number,
            required: [true, 'Please provide a withdrawal amount'],
            min: [5, 'Minimum withdrawal amount is $5'] // Default minimum withdrawal
        },
        paypalEmail: {
            type: String,
            required: [true, 'Please provide a PayPal email for payout'],
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please add a valid email'
            ]
        },
        status: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'rejected'],
            default: 'pending'
        },
        transactionId: {
            type: String,
            // Populated when the Admin actually pays out the provider via PayPal
        },
        adminNotes: {
            type: String,
        }
    },
    {
        timestamps: true
    }
);

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);

export default Withdrawal;
