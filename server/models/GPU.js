import mongoose from 'mongoose';

const gpuSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'GPU name is required'],
      trim: true,
    },
    manufacturer: {
      type: String,
      enum: ['NVIDIA', 'AMD', 'Intel', 'Other'],
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    vram: {
      type: Number,
      required: [true, 'VRAM size is required'],
      min: [1, 'VRAM must be at least 1GB'],
    },
    clockSpeed: {
      type: Number,
      required: true,
    },
    cudaCores: {
      type: Number,
      default: 0,
    },
    pricePerHour: {
      type: Number,
      required: [true, 'Price per hour is required'],
      min: [0.01, 'Price must be at least $0.01'],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    currentSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      default: null,
    },
    location: {
      country: String,
      region: String,
      city: String,
    },
    specifications: {
      memoryType: String,
      memoryBandwidth: Number,
      powerConsumption: Number,
      ports: [String],
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    totalHoursRented: {
      type: Number,
      default: 0,
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
gpuSchema.index({ provider: 1, isActive: 1 });
gpuSchema.index({ isAvailable: 1, isActive: 1 });
gpuSchema.index({ manufacturer: 1, vram: 1 });

const GPU = mongoose.model('GPU', gpuSchema);

export default GPU;
