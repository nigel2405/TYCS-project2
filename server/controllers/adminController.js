import User from '../models/User.js';
import GPU from '../models/GPU.js';
import Session from '../models/Session.js';
import { processBillingForAllActiveSessions } from '../utils/sessionBilling.js';

// @desc    Get platform statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
export const getPlatformStats = async (req, res, next) => {
  try {
    // User stats
    const totalUsers = await User.countDocuments();
    const providers = await User.countDocuments({ role: 'provider' });
    const consumers = await User.countDocuments({ role: 'consumer' });
    const approvedProviders = await User.countDocuments({
      role: 'provider',
      isProviderApproved: true,
    });

    // GPU stats
    const totalGPUs = await GPU.countDocuments({ isActive: true });
    const availableGPUs = await GPU.countDocuments({ isActive: true, isAvailable: true });
    const activeGPUs = await GPU.countDocuments({ isActive: true, currentSession: { $ne: null } });

    // Session stats
    const totalSessions = await Session.countDocuments();
    const activeSessions = await Session.countDocuments({ status: 'active' });
    const completedSessions = await Session.countDocuments({ status: 'completed' });
    const pendingSessions = await Session.countDocuments({ status: 'pending' });

    // Revenue stats
    const completedSessionsData = await Session.find({ status: 'completed' });
    const totalRevenue = completedSessionsData.reduce(
      (sum, session) => sum + (session.totalCost || 0),
      0
    );

    // Recent activity
    const recentSessions = await Session.find()
      .populate('consumer', 'username email')
      .populate('provider', 'username email')
      .populate('gpu', 'name model')
      .sort({ createdAt: -1 })
      .limit(10);

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('username email role createdAt');

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          providers,
          consumers,
          approvedProviders,
        },
        gpus: {
          total: totalGPUs,
          available: availableGPUs,
          active: activeGPUs,
        },
        sessions: {
          total: totalSessions,
          active: activeSessions,
          completed: completedSessions,
          pending: pendingSessions,
        },
        revenue: {
          total: totalRevenue,
        },
        recentSessions,
        recentUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
export const getUsers = async (req, res, next) => {
  try {
    const { role, isActive, isProviderApproved, limit = 50, skip = 0 } = req.query;

    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (isProviderApproved !== undefined) query.isProviderApproved = isProviderApproved === 'true';

    const users = await User.find(query)
      .select('-password -twoFactorSecret')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      data: { users },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password -twoFactorSecret');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
export const updateUser = async (req, res, next) => {
  try {
    const { role, isActive, isProviderApproved, walletBalance } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent modifying admin accounts
    if (user.role === 'admin' && req.user.id.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify other admin accounts',
      });
    }

    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (isProviderApproved !== undefined) user.isProviderApproved = isProviderApproved;
    if (walletBalance !== undefined) user.walletBalance = walletBalance;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve provider
// @route   POST /api/admin/providers/:id/approve
// @access  Private (Admin)
export const approveProvider = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role !== 'provider') {
      return res.status(400).json({
        success: false,
        message: 'User is not a provider',
      });
    }

    user.isProviderApproved = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Provider approved successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Suspend provider
// @route   POST /api/admin/providers/:id/suspend
// @access  Private (Admin)
export const suspendProvider = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.isProviderApproved = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Provider suspended successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all GPUs
// @route   GET /api/admin/gpus
// @access  Private (Admin)
export const getAllGPUs = async (req, res, next) => {
  try {
    const { isActive, isAvailable, provider, limit = 50, skip = 0 } = req.query;

    const query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (isAvailable !== undefined) query.isAvailable = isAvailable === 'true';
    if (provider) query.provider = provider;

    const gpus = await GPU.find(query)
      .populate('provider', 'username email')
      .sort({ createdAt: -1 })
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

// @desc    Get all sessions
// @route   GET /api/admin/sessions
// @access  Private (Admin)
export const getAllSessions = async (req, res, next) => {
  try {
    const { status, consumer, provider, limit = 50, skip = 0 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (consumer) query.consumer = consumer;
    if (provider) query.provider = provider;

    const sessions = await Session.find(query)
      .populate('consumer', 'username email')
      .populate('provider', 'username email')
      .populate('gpu', 'name model')
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

// @desc    Process billing for all active sessions
// @route   POST /api/admin/billing/process
// @access  Private (Admin)
export const processBilling = async (req, res, next) => {
  try {
    const results = await processBillingForAllActiveSessions();

    res.status(200).json({
      success: true,
      message: 'Billing processed for all active sessions',
      data: { results },
    });
  } catch (error) {
    next(error);
  }
};
