import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    consumer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    gpu: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GPU',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'completed', 'cancelled', 'terminated'],
      default: 'pending',
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    duration: {
      // Duration in minutes
      type: Number,
      default: 0,
    },
    totalCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    hourlyRate: {
      type: Number,
      required: true,
    },
    workloadType: {
      type: String,
      enum: ['gaming', 'ml', 'rendering', 'video-processing', 'other'],
      default: 'other',
    },
    connectionDetails: {
      ip: String,
      port: Number,
      accessToken: String,
    },
    metrics: {
      gpuUtilization: [Number], // Array of percentage values over time
      temperature: [Number], // Array of temperature values
      memoryUsed: [Number], // Array of memory usage in MB
      lastUpdated: Date,
    },
    isBilled: {
      type: Boolean,
      default: false,
    },
    billingInterval: {
      // Billing interval in minutes (e.g., 60 for hourly billing)
      type: Number,
      default: 60,
    },
    lastBilledAt: {
      type: Date,
    },
    cancellationReason: String,
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
sessionSchema.index({ consumer: 1, status: 1 });
sessionSchema.index({ provider: 1, status: 1 });
sessionSchema.index({ gpu: 1, status: 1 });
sessionSchema.index({ status: 1, startTime: 1 });

// Virtual for calculated duration
sessionSchema.virtual('calculatedDuration').get(function () {
  if (!this.startTime) return 0;
  const end = this.endTime || new Date();
  return Math.round((end - this.startTime) / (1000 * 60)); // Duration in minutes
});

// Virtual for calculated cost
sessionSchema.virtual('calculatedCost').get(function () {
  const durationHours = this.calculatedDuration / 60;
  return durationHours * this.hourlyRate;
});

const Session = mongoose.model('Session', sessionSchema);

export default Session;
