import Session from '../models/Session.js';
import User from '../models/User.js';
import GPU from '../models/GPU.js';

// Calculate billing for active sessions
export const calculateSessionBilling = async (sessionId) => {
  const session = await Session.findById(sessionId)
    .populate('consumer')
    .populate('provider')
    .populate('gpu');

  if (!session || session.status !== 'active') {
    return null;
  }

  const now = new Date();
  const startTime = session.startTime || session.createdAt;
  const lastBilledAt = session.lastBilledAt || startTime;

  // Calculate minutes since last billing
  const minutesSinceLastBilling = Math.floor((now - lastBilledAt) / (1000 * 60));
  const billingIntervalMinutes = session.billingInterval || 60;

  // Only bill if we've reached the billing interval
  if (minutesSinceLastBilling < billingIntervalMinutes) {
    return null;
  }

  // Calculate cost for this billing period
  const hoursToBill = billingIntervalMinutes / 60;
  const cost = hoursToBill * session.hourlyRate;

  // Update session
  session.lastBilledAt = now;
  session.totalCost = (session.totalCost || 0) + cost;
  session.duration = session.duration + billingIntervalMinutes;

  // Deduct from consumer wallet
  const consumer = await User.findById(session.consumer._id || session.consumer);
  if (consumer.walletBalance < cost) {
    // Insufficient funds - terminate session
    session.status = 'terminated';
    session.endTime = now;
    await session.save();
    return { terminated: true, reason: 'Insufficient wallet balance' };
  }

  consumer.walletBalance -= cost;
  await consumer.save();

  // Add to provider wallet
  const provider = await User.findById(session.provider._id || session.provider);
  provider.walletBalance = (provider.walletBalance || 0) + cost;
  await provider.save();

  // Update GPU earnings
  const gpu = await GPU.findById(session.gpu._id || session.gpu);
  gpu.totalEarnings = (gpu.totalEarnings || 0) + cost;
  gpu.totalHoursRented = (gpu.totalHoursRented || 0) + hoursToBill;
  await gpu.save();

  await session.save();

  return {
    billed: true,
    cost,
    hoursToBill,
    consumerBalance: consumer.walletBalance,
    providerBalance: provider.walletBalance,
  };
};

// Process billing for all active sessions
export const processBillingForAllActiveSessions = async () => {
  const activeSessions = await Session.find({ status: 'active' });
  const results = [];

  for (const session of activeSessions) {
    try {
      const result = await calculateSessionBilling(session._id);
      if (result) {
        results.push({ sessionId: session._id, ...result });
      }
    } catch (error) {
      console.error(`Error billing session ${session._id}:`, error);
      results.push({ sessionId: session._id, error: error.message });
    }
  }

  return results;
};

// Finalize billing when session ends
export const finalizeSessionBilling = async (sessionId) => {
  const session = await Session.findById(sessionId)
    .populate('consumer')
    .populate('provider')
    .populate('gpu');

  if (!session || session.status === 'completed' || session.status === 'cancelled') {
    return null;
  }

  const endTime = session.endTime || new Date();
  const startTime = session.startTime || session.createdAt;
  const lastBilledAt = session.lastBilledAt || startTime;

  // Calculate remaining unbilled time
  const minutesRemaining = Math.floor((endTime - lastBilledAt) / (1000 * 60));
  if (minutesRemaining <= 0) {
    session.status = 'completed';
    session.isBilled = true;
    await session.save();
    return { alreadyBilled: true };
  }

  // Calculate final cost
  const hoursToBill = minutesRemaining / 60;
  const cost = hoursToBill * session.hourlyRate;

  // Update session totals
  session.totalCost = (session.totalCost || 0) + cost;
  session.duration = session.duration + minutesRemaining;
  session.lastBilledAt = endTime;

  // Deduct from consumer wallet
  const consumer = await User.findById(session.consumer._id || session.consumer);
  if (consumer.walletBalance < cost) {
    // Insufficient funds - mark as completed but log issue
    session.status = 'completed';
    session.isBilled = false;
    await session.save();
    return { insufficientFunds: true, required: cost, available: consumer.walletBalance };
  }

  consumer.walletBalance -= cost;
  await consumer.save();

  // Add to provider wallet
  const provider = await User.findById(session.provider._id || session.provider);
  provider.walletBalance = (provider.walletBalance || 0) + cost;
  await provider.save();

  // Update GPU earnings
  const gpu = await GPU.findById(session.gpu._id || session.gpu);
  gpu.totalEarnings = (gpu.totalEarnings || 0) + cost;
  gpu.totalHoursRented = (gpu.totalHoursRented || 0) + hoursToBill;
  gpu.currentSession = null;
  gpu.isAvailable = true;
  await gpu.save();

  // Mark session as completed and billed
  session.status = 'completed';
  session.isBilled = true;
  await session.save();

  return {
    finalized: true,
    cost,
    hoursToBill,
    consumerBalance: consumer.walletBalance,
    providerBalance: provider.walletBalance,
  };
};
