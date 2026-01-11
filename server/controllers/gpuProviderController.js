import GPU from '../models/GPU.js';
import Session from '../models/Session.js';
import { detectGPU } from '../utils/gpuDetector.js';

// @desc    Register a new GPU
// @route   POST /api/provider/gpus
// @access  Private (Provider)
export const registerGPU = async (req, res, next) => {
  try {
    const { name, pricePerHour, location, autoDetect } = req.body;

    // Check if user is provider and approved
    if (req.user.role !== 'provider' || !req.user.isProviderApproved) {
      return res.status(403).json({
        success: false,
        message: 'You must be an approved provider to register GPUs',
      });
    }

    let gpuSpecs = {};

    // Auto-detect GPU specs if requested
    if (autoDetect) {
      gpuSpecs = await detectGPU();
    } else {
      // Manual GPU registration requires all specs
      const {
        manufacturer,
        model,
        vram,
        clockSpeed,
        cudaCores,
        memoryType,
        memoryBandwidth,
        powerConsumption,
        ports,
      } = req.body;

      if (!manufacturer || !model || !vram) {
        return res.status(400).json({
          success: false,
          message: 'Please provide GPU specifications (manufacturer, model, vram)',
        });
      }

      gpuSpecs = {
        manufacturer,
        model,
        vram: parseInt(vram),
        clockSpeed: clockSpeed ? parseInt(clockSpeed) : 0,
        cudaCores: cudaCores ? parseInt(cudaCores) : 0,
        memoryType,
        memoryBandwidth,
        powerConsumption,
        ports: ports ? (Array.isArray(ports) ? ports : [ports]) : [],
      };
    }

    if (!pricePerHour || pricePerHour < 0.01) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid price per hour (minimum $0.01)',
      });
    }

    // Create GPU
    const gpu = await GPU.create({
      provider: req.user.id,
      name: name || `${gpuSpecs.manufacturer} ${gpuSpecs.model}`,
      manufacturer: gpuSpecs.manufacturer,
      model: gpuSpecs.model,
      vram: gpuSpecs.vram,
      clockSpeed: gpuSpecs.clockSpeed,
      cudaCores: gpuSpecs.cudaCores,
      pricePerHour: parseFloat(pricePerHour),
      isAvailable: true,
      isActive: true,
      location: location || {},
      specifications: {
        memoryType: gpuSpecs.memoryType,
        memoryBandwidth: gpuSpecs.memoryBandwidth,
        powerConsumption: gpuSpecs.powerConsumption,
        ports: gpuSpecs.ports || [],
      },
    });

    res.status(201).json({
      success: true,
      message: 'GPU registered successfully',
      data: { gpu },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all GPUs for the provider
// @route   GET /api/provider/gpus
// @access  Private (Provider)
export const getMyGPUs = async (req, res, next) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({
        success: false,
        message: 'You must be a provider to access this route',
      });
    }

    const gpus = await GPU.find({ provider: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: gpus.length,
      data: { gpus },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single GPU
// @route   GET /api/provider/gpus/:id
// @access  Private (Provider)
export const getGPU = async (req, res, next) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({
        success: false,
        message: 'You must be a provider to access this route',
      });
    }

    const gpu = await GPU.findOne({ _id: req.params.id, provider: req.user.id });

    if (!gpu) {
      return res.status(404).json({
        success: false,
        message: 'GPU not found',
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

// @desc    Update GPU
// @route   PUT /api/provider/gpus/:id
// @access  Private (Provider)
export const updateGPU = async (req, res, next) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({
        success: false,
        message: 'You must be a provider to access this route',
      });
    }

    const gpu = await GPU.findOne({ _id: req.params.id, provider: req.user.id });

    if (!gpu) {
      return res.status(404).json({
        success: false,
        message: 'GPU not found',
      });
    }

    // Don't allow updating if GPU has an active session
    if (gpu.currentSession) {
      const activeSession = await Session.findById(gpu.currentSession);
      if (activeSession && activeSession.status === 'active') {
        return res.status(400).json({
          success: false,
          message: 'Cannot update GPU while it has an active session',
        });
      }
    }

    // Update fields
    const { name, pricePerHour, isAvailable, location } = req.body;

    if (name) gpu.name = name;
    if (pricePerHour !== undefined) {
      if (pricePerHour < 0.01) {
        return res.status(400).json({
          success: false,
          message: 'Price per hour must be at least $0.01',
        });
      }
      gpu.pricePerHour = parseFloat(pricePerHour);
    }
    if (isAvailable !== undefined) {
      // Don't allow making unavailable if there's an active session
      if (!isAvailable && gpu.currentSession) {
        const activeSession = await Session.findById(gpu.currentSession);
        if (activeSession && activeSession.status === 'active') {
          return res.status(400).json({
            success: false,
            message: 'Cannot set GPU unavailable while it has an active session',
          });
        }
      }
      gpu.isAvailable = isAvailable;
    }
    if (location) gpu.location = { ...gpu.location, ...location };

    await gpu.save();

    res.status(200).json({
      success: true,
      message: 'GPU updated successfully',
      data: { gpu },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete GPU
// @route   DELETE /api/provider/gpus/:id
// @access  Private (Provider)
export const deleteGPU = async (req, res, next) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({
        success: false,
        message: 'You must be a provider to access this route',
      });
    }

    const gpu = await GPU.findOne({ _id: req.params.id, provider: req.user.id });

    if (!gpu) {
      return res.status(404).json({
        success: false,
        message: 'GPU not found',
      });
    }

    // Don't allow deletion if GPU has an active session
    if (gpu.currentSession) {
      const activeSession = await Session.findById(gpu.currentSession);
      if (activeSession && activeSession.status === 'active') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete GPU while it has an active session',
        });
      }
    }

    // Soft delete - set isActive to false
    gpu.isActive = false;
    gpu.isAvailable = false;
    await gpu.save();

    res.status(200).json({
      success: true,
      message: 'GPU deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get provider earnings and stats
// @route   GET /api/provider/earnings
// @access  Private (Provider)
export const getEarnings = async (req, res, next) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({
        success: false,
        message: 'You must be a provider to access this route',
      });
    }

    // Get all GPUs for this provider
    const gpus = await GPU.find({ provider: req.user.id, isActive: true });

    // Calculate total earnings
    const totalEarnings = gpus.reduce((sum, gpu) => sum + (gpu.totalEarnings || 0), 0);
    const totalHoursRented = gpus.reduce((sum, gpu) => sum + (gpu.totalHoursRented || 0), 0);

    // Get all sessions for this provider
    const sessions = await Session.find({ provider: req.user.id })
      .populate('consumer', 'username email')
      .populate('gpu', 'name model')
      .sort({ createdAt: -1 })
      .limit(50);

    // Calculate recent earnings (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSessions = await Session.find({
      provider: req.user.id,
      status: 'completed',
      createdAt: { $gte: thirtyDaysAgo },
    });

    const recentEarnings = recentSessions.reduce((sum, session) => sum + (session.totalCost || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        totalEarnings,
        totalHoursRented,
        recentEarnings,
        gpuCount: gpus.length,
        activeSessions: sessions.filter((s) => s.status === 'active').length,
        recentSessions: sessions.slice(0, 10),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get provider session history
// @route   GET /api/provider/sessions
// @access  Private (Provider)
export const getSessionHistory = async (req, res, next) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({
        success: false,
        message: 'You must be a provider to access this route',
      });
    }

    const { status, limit = 50, skip = 0 } = req.query;

    const query = { provider: req.user.id };
    if (status) {
      query.status = status;
    }

    const sessions = await Session.find(query)
      .populate('consumer', 'username email')
      .populate('gpu', 'name model vram')
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
