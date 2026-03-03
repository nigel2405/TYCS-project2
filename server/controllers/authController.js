import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { username, email, password, role, profile } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email, and password',
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or username',
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      role: role === 'admin' ? 'consumer' : (role || 'consumer'),
      profile: profile || {},
      // Auto-approve providers if admin sets it (for demo purposes, we can auto-approve)
      isProviderApproved: role === 'provider' ? false : true,
    });

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          walletBalance: user.walletBalance,
          isProviderApproved: user.isProviderApproved,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password, source } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Check for Admin from .env
    if (
      process.env.ADMIN_EMAIL &&
      process.env.ADMIN_PASSWORD &&
      email === process.env.ADMIN_EMAIL
    ) {
      if (password === process.env.ADMIN_PASSWORD) {
        // Find or Create Admin User
        let adminUser = await User.findOne({ email: process.env.ADMIN_EMAIL });

        if (!adminUser) {
          adminUser = await User.create({
            username: 'Admin',
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD, // Hash will be handled by pre-save hook
            role: 'admin',
            isProviderApproved: true,
            isActive: true,
            walletBalance: 0,
          });
        } else {
          // Ensure role is admin if it was changed
          if (adminUser.role !== 'admin') {
            adminUser.role = 'admin';
            await adminUser.save();
          }
        }

        // Update last login
        adminUser.lastLogin = new Date();
        await adminUser.save();

        const token = generateToken(adminUser._id);

        return res.status(200).json({
          success: true,
          message: 'Admin Login successful',
          data: {
            token,
            user: {
              id: adminUser._id,
              username: adminUser.username,
              email: adminUser.email,
              role: adminUser.role,
              walletBalance: adminUser.walletBalance,
              isProviderApproved: adminUser.isProviderApproved,
            },
          },
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid Admin credentials',
        });
      }
    }

    // Check for user (include password for comparison)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Role-based source restriction
    if (source === 'admin' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Admin portal is for administrators only',
      });
    }

    if (source === 'client' && user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admins must log in via the dedicated admin portal',
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          walletBalance: user.walletBalance,
          isProviderApproved: user.isProviderApproved,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          walletBalance: user.walletBalance,
          isProviderApproved: user.isProviderApproved,
          isTwoFactorEnabled: user.isTwoFactorEnabled,
          profile: user.profile,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const { profile } = req.body;

    const user = await User.findById(req.user.id);

    if (profile) {
      user.profile = { ...user.profile, ...profile };
    }

    if (req.body.password) {
      user.password = req.body.password;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          profile: user.profile,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add funds to wallet
// @route   POST /api/auth/wallet/add
// @access  Private
export const addWalletFunds = async (req, res, next) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid amount',
      });
    }

    const user = await User.findById(req.user.id);
    user.walletBalance = (user.walletBalance || 0) + amount;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Funds added successfully',
      data: {
        walletBalance: user.walletBalance,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'There is no user with that email' });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Create reset url
    // Since client runs on port 3000 typically, we construct the reset URL
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/resetpassword/${resetToken}`;

    const htmlMsg = `
      <h2>Password Reset Request</h2>
      <p>We have received a request to reset your password. You can reset your password by clicking the link below:</p>
      <a href="${resetUrl}" style="padding: 10px 15px; background: #25CCF7; color: #fff; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
      <p>If you did not request this, please ignore this email.</p>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Token',
        html: htmlMsg
      });

      res.status(200).json({ success: true, message: 'Email sent' });
    } catch (err) {
      console.log(err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });

      return res.status(500).json({ success: false, message: 'Email could not be sent' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now log in.'
    });
  } catch (error) {
    next(error);
  }
};
