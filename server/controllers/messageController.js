import Message from '../models/Message.js';
import Session from '../models/Session.js';

// @desc    Get messages for a session
// @route   GET /api/sessions/:id/messages
// @access  Private
export const getMessages = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { limit = 50, skip = 0 } = req.query;

        // Check if session exists and user is part of it
        const session = await Session.findById(id);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found',
            });
        }

        if (
            session.consumer.toString() !== req.user.id.toString() &&
            session.provider.toString() !== req.user.id.toString() &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view messages for this session',
            });
        }

        const messages = await Message.find({ session: id })
            .populate('sender', 'username role')
            .sort({ createdAt: 1 }) // Oldest first for chat history
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        res.status(200).json({
            success: true,
            count: messages.length,
            data: { messages },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Send a message
// @route   POST /api/sessions/:id/messages
// @access  Private
export const sendMessage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({
                success: false,
                message: 'Message content is required',
            });
        }

        // Check if session exists and user is part of it
        const session = await Session.findById(id);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found',
            });
        }

        if (
            session.consumer.toString() !== req.user.id.toString() &&
            session.provider.toString() !== req.user.id.toString() &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to send messages in this session',
            });
        }

        const message = await Message.create({
            session: id,
            sender: req.user.id,
            content,
        });

        // Populate sender details for immediate display
        await message.populate('sender', 'username role');

        // Emit socket event (handled in router or separate socket handler if possible, 
        // but here we can rely on client polling or cleaner socket integration)
        const io = req.app.get('io');
        if (io) {
            io.to(`session:${id}`).emit('receive-message', message);
        }

        res.status(201).json({
            success: true,
            data: { message },
        });
    } catch (error) {
        next(error);
    }
};
