import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
    {
        session: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Session',
            required: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
        },
        readAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
messageSchema.index({ session: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
