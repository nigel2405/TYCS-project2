import Session from '../models/Session.js';
import GPU from '../models/GPU.js';
import User from '../models/User.js';
import Review from '../models/Review.js';
import { finalizeSessionBilling } from '../utils/sessionBilling.js';
import sendEmail from '../utils/sendEmail.js';

// @desc    Start a session
// @route   POST /api/sessions/:id/start
// @access  Private
export const startSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('consumer')
      .populate('gpu');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    // Check authorization
    if (
      session.consumer._id.toString() !== req.user.id.toString() &&
      session.provider.toString() !== req.user.id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to start this session',
      });
    }

    if (session.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Session is already ${session.status}`,
      });
    }

    // Check consumer wallet
    const consumer = await User.findById(session.consumer._id || session.consumer);
    if (consumer.walletBalance < session.hourlyRate) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance',
        required: session.hourlyRate,
        available: consumer.walletBalance,
      });
    }

    // Update session
    session.status = 'active';
    session.startTime = new Date();
    session.lastBilledAt = new Date();

    // Emit start command to provider agent
    const io = req.app.get('io');
    io.to(`provider:${session.provider._id.toString()}`).emit('start-workload', {
      sessionId: session._id,
      gpuId: session.gpu._id,
      workloadType: session.serviceType || 'jupyter',
      duration: session.duration || 60,
    });

    // We don't set connectionDetails yet - waiting for agent
    session.connectionUrl = null;

    // Initialize metrics
    session.metrics = {
      gpuUtilization: [0],
      temperature: [0],
      memoryUsed: [0],
      lastUpdated: new Date(),
    };

    await session.save();

    // Update GPU
    const gpu = await GPU.findById(session.gpu._id || session.gpu);
    gpu.currentSession = session._id;
    gpu.isAvailable = false;
    await gpu.save();

    res.status(200).json({
      success: true,
      message: 'Session started successfully',
      data: { session },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Stop/End a session
// @route   POST /api/sessions/:id/stop
// @access  Private
export const stopSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('consumer')
      .populate('gpu');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    // Check authorization
    if (
      session.consumer._id.toString() !== req.user.id.toString() &&
      session.provider.toString() !== req.user.id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to stop this session',
      });
    }

    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Session is not active. Current status: ${session.status}`,
      });
    }

    // Finalize billing
    session.endTime = new Date();
    await session.save();

    const billingResult = await finalizeSessionBilling(session._id);

    // Reload session
    const updatedSession = await Session.findById(req.params.id)
      .populate('consumer', 'username email')
      .populate('provider', 'username email')
      .populate('gpu', 'name model');

    // Send Receipt Email to Consumer (Non-blocking)
    if (billingResult) {
      sendEmail({
        email: updatedSession.consumer.email,
        subject: `Receipt: GPU Session #${updatedSession._id.toString().substring(0, 8)}`,
        html: `
          <h2>Thank you for your business!</h2>
          <p>Your session on the <strong>${updatedSession.gpu.name}</strong> has concluded.</p>
          <ul>
            <li><strong>Duration:</strong> ${((billingResult.duration || 0) / 60).toFixed(2)} hours</li>
            <li><strong>Hourly Rate:</strong> $${updatedSession.hourlyRate}/hr</li>
            <li><strong>Total Billed:</strong> $${(billingResult.totalCost || updatedSession.totalCost || 0).toFixed(2)}</li>
          </ul>
          <p>This amount has been deducted from your platform wallet. You currently have $${updatedSession.consumer.walletBalance || 0} remaining.</p>
        `
      }).catch(emailErr => {
        console.error('Failed to send receipt email to consumer:', emailErr);
      });
    }

    res.status(200).json({
      success: true,
      message: 'Session stopped successfully',
      data: {
        session: updatedSession,
        billing: billingResult,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a pending session
// @route   POST /api/sessions/:id/cancel
// @access  Private
export const cancelSession = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const session = await Session.findById(req.params.id)
      .populate('consumer')
      .populate('gpu');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    // Check authorization
    if (
      session.consumer._id.toString() !== req.user.id.toString() &&
      session.provider.toString() !== req.user.id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this session',
      });
    }

    if (session.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel pending sessions',
      });
    }

    // Update session
    session.status = 'cancelled';
    session.endTime = new Date();
    session.cancellationReason = reason || 'Cancelled by user';

    await session.save();

    // Update GPU
    const gpu = await GPU.findById(session.gpu._id || session.gpu);
    gpu.currentSession = null;
    gpu.isAvailable = true;
    await gpu.save();

    res.status(200).json({
      success: true,
      message: 'Session cancelled successfully',
      data: { session },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get session details
// @route   GET /api/sessions/:id
// @access  Private
export const getSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('consumer', 'username email')
      .populate('provider', 'username email')
      .populate('gpu', 'name model vram manufacturer specifications');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    // Check authorization
    if (
      session.consumer._id.toString() !== req.user.id.toString() &&
      session.provider._id.toString() !== req.user.id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this session',
      });
    }

    res.status(200).json({
      success: true,
      data: { session },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update session metrics (Legacy/Internal manually triggered sync)
// @route   PUT /api/sessions/:id/metrics
// @access  Private
export const updateMetrics = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session || session.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Session is not active',
      });
    }

    // Acknowledge the request, metrics are now pushed by the agent
    res.status(200).json({
      success: true,
      data: { metrics: session.metrics },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get session metrics
// @route   GET /api/sessions/:id/metrics
// @access  Private
export const getMetrics = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id).select('metrics status consumer provider');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    // Check authorization
    if (session.consumer.toString() !== req.user.id.toString() &&
      session.provider.toString() !== req.user.id.toString() &&
      req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view metrics',
      });
    }

    // Calculate current averages
    const metrics = session.metrics || {
      gpuUtilization: [],
      temperature: [],
      memoryUsed: [],
    };

    const avgUtilization =
      metrics.gpuUtilization.length > 0
        ? metrics.gpuUtilization.reduce((a, b) => a + b, 0) / metrics.gpuUtilization.length
        : 0;
    const avgTemperature =
      metrics.temperature.length > 0
        ? metrics.temperature.reduce((a, b) => a + b, 0) / metrics.temperature.length
        : 0;
    const avgMemory =
      metrics.memoryUsed.length > 0
        ? metrics.memoryUsed.reduce((a, b) => a + b, 0) / metrics.memoryUsed.length
        : 0;

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          ...metrics,
          averages: {
            utilization: Math.round(avgUtilization),
            temperature: Math.round(avgTemperature),
            memoryUsed: Math.round(avgMemory),
          },
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a review for a completed session
// @route   POST /api/sessions/:id/review
// @access  Private (Consumer)
export const addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    // Find the session
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Check if the user is the consumer of this session
    if (session.consumer.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the consumer of this session can review it' });
    }

    // Check if the session is completed or stopped
    if (session.status !== 'completed' && session.status !== 'stopped') {
      return res.status(400).json({ success: false, message: 'Can only review completed or stopped sessions' });
    }

    // Check if the review already exists
    const existingReview = await Review.findOne({ session: session._id });

    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this session' });
    }

    const review = await Review.create({
      session: session._id,
      gpu: session.gpu,
      consumer: req.user.id,
      provider: session.provider,
      rating: Number(rating),
      comment
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: { review }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this session' });
    }
    next(error);
  }
};
