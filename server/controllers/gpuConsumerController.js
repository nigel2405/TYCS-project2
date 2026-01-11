import GPU from '../models/GPU.js';
import Session from '../models/Session.js';
import User from '../models/User.js';

// @desc    Browse available GPUs
// @route   GET /api/consumer/gpus
// @access  Private (Consumer)
export const browseGPUs = async (req, res, next) => {
  try {
    const {
      manufacturer,
      minVRAM,
      maxVRAM,
      maxPrice,
      minPrice,
      country,
      search,
      sortBy = 'pricePerHour',
      sortOrder = 'asc',
      limit = 20,
      skip = 0,
    } = req.query;

    // Build query
    const query = {
      isAvailable: true,
      isActive: true,
      currentSession: null, // Only show GPUs without active sessions
    };

    // Filter by provider approval
    const providers = await User.find({ role: 'provider', isProviderApproved: true });
    const providerIds = providers.map((p) => p._id);
    query.provider = { $in: providerIds };

    if (manufacturer) {
      query.manufacturer = manufacturer;
    }

    if (minVRAM || maxVRAM) {
      query.vram = {};
      if (minVRAM) query.vram.$gte = parseInt(minVRAM);
      if (maxVRAM) query.vram.$lte = parseInt(maxVRAM);
    }

    if (minPrice || maxPrice) {
      query.pricePerHour = {};
      if (minPrice) query.pricePerHour.$gte = parseFloat(minPrice);
      if (maxPrice) query.pricePerHour.$lte = parseFloat(maxPrice);
    }

    if (country) {
      query['location.country'] = country;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const gpus = await GPU.find(query)
      .populate('provider', 'username email location')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await GPU.countDocuments(query);

    res.status(200).json({
      success: true,
      count: gpus.length,
      total,
      data: { gpus },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single GPU details
// @route   GET /api/consumer/gpus/:id
// @access  Private (Consumer)
export const getGPUDetails = async (req, res, next) => {
  try {
    const gpu = await GPU.findById(req.params.id)
      .populate('provider', 'username email profile location')
      .populate('currentSession', 'status consumer startTime');

    if (!gpu || !gpu.isActive) {
      return res.status(404).json({
        success: false,
        message: 'GPU not found',
      });
    }

    // Check if provider is approved
    const provider = await User.findById(gpu.provider._id || gpu.provider);
    if (!provider || !provider.isProviderApproved) {
      return res.status(404).json({
        success: false,
        message: 'GPU not available',
      });
    }

    res.status(200).json({
      success: true,
      data: { gpu },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request GPU session
// @route   POST /api/consumer/sessions/request
// @access  Private (Consumer)
export const requestSession = async (req, res, next) => {
  try {
    const { gpuId, workloadType } = req.body;

    if (!gpuId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide GPU ID',
      });
    }

    // Get GPU
    const gpu = await GPU.findById(gpuId).populate('provider');

    if (!gpu || !gpu.isActive) {
      return res.status(404).json({
        success: false,
        message: 'GPU not found',
      });
    }

    // Check if provider is approved
    if (!gpu.provider.isProviderApproved) {
      return res.status(400).json({
        success: false,
        message: 'GPU provider is not approved',
      });
    }

    // Check if GPU is available
    if (!gpu.isAvailable || gpu.currentSession) {
      return res.status(400).json({
        success: false,
        message: 'GPU is not available',
      });
    }

    // Check if consumer has sufficient wallet balance
    const consumer = await User.findById(req.user.id);
    if (consumer.walletBalance < gpu.pricePerHour) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance. Please add funds to your wallet.',
        required: gpu.pricePerHour,
        available: consumer.walletBalance,
      });
    }

    // Create session
    const session = await Session.create({
      consumer: req.user.id,
      provider: gpu.provider._id || gpu.provider,
      gpu: gpu._id,
      status: 'pending',
      hourlyRate: gpu.pricePerHour,
      workloadType: workloadType || 'other',
      billingInterval: 60, // 1 hour
    });

    // Update GPU
    gpu.currentSession = session._id;
    await gpu.save();

    res.status(201).json({
      success: true,
      message: 'Session requested successfully',
      data: { session },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get consumer sessions
// @route   GET /api/consumer/sessions
// @access  Private (Consumer)
export const getMySessions = async (req, res, next) => {
  try {
    const { status, limit = 50, skip = 0 } = req.query;

    const query = { consumer: req.user.id };
    if (status) {
      query.status = status;
    }

    const sessions = await Session.find(query)
      .populate('provider', 'username email')
      .populate('gpu', 'name model vram manufacturer')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Session.countDocuments(query);

    res.status(200).json({
      success: true,
      count: sessions.length,
      total,
      data: { sessions },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get consumer wallet and usage summary
// @route   GET /api/consumer/summary
// @access  Private (Consumer)
export const getConsumerSummary = async (req, res, next) => {
  try {
    const consumer = await User.findById(req.user.id);

    // Get session stats
    const totalSessions = await Session.countDocuments({ consumer: req.user.id });
    const activeSessions = await Session.countDocuments({
      consumer: req.user.id,
      status: 'active',
    });
    const completedSessions = await Session.countDocuments({
      consumer: req.user.id,
      status: 'completed',
    });

    // Calculate total spent
    const completedSessionsData = await Session.find({
      consumer: req.user.id,
      status: 'completed',
    });
    const totalSpent = completedSessionsData.reduce(
      (sum, session) => sum + (session.totalCost || 0),
      0
    );

    // Get total hours used
    const totalHours = completedSessionsData.reduce(
      (sum, session) => sum + (session.duration || 0) / 60,
      0
    );

    // Get recent sessions
    const recentSessions = await Session.find({ consumer: req.user.id })
      .populate('gpu', 'name model')
      .populate('provider', 'username')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        walletBalance: consumer.walletBalance,
        totalSessions,
        activeSessions,
        completedSessions,
        totalSpent,
        totalHours,
        recentSessions,
      },
    });
  } catch (error) {
    next(error);
  }
};
