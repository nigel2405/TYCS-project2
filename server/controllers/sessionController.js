import Session from '../models/Session.js';
import GPU from '../models/GPU.js';
import User from '../models/User.js';
import { finalizeSessionBilling } from '../utils/sessionBilling.js';

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

    // Generate mock connection details
    session.connectionDetails = {
      ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
      port: 5900 + Math.floor(Math.random() * 100),
      accessToken: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    };

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

// @desc    Update session metrics (mock data for monitoring)
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

    // Generate mock metrics
    const metrics = {
      gpuUtilization: [
        ...(session.metrics?.gpuUtilization || []),
        Math.floor(Math.random() * 100),
      ].slice(-100), // Keep last 100 readings
      temperature: [
        ...(session.metrics?.temperature || []),
        40 + Math.floor(Math.random() * 40),
      ].slice(-100),
      memoryUsed: [
        ...(session.metrics?.memoryUsed || []),
        Math.floor(Math.random() * 10000),
      ].slice(-100),
      lastUpdated: new Date(),
    };

    session.metrics = metrics;
    await session.save();

    res.status(200).json({
      success: true,
      data: { metrics },
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
    const session = await Session.findById(req.params.id).select('metrics status');

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
