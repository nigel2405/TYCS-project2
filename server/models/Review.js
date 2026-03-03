import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
    {
        session: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Session',
            required: true,
            unique: true // One review per session
        },
        gpu: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'GPU',
            required: true
        },
        consumer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        provider: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        rating: {
            type: Number,
            required: [true, 'Please provide a rating between 1 and 5'],
            min: 1,
            max: 5
        },
        comment: {
            type: String,
            trim: true,
            maxlength: [500, 'Review cannot be more than 500 characters']
        }
    },
    {
        timestamps: true
    }
);

// Prevent user from submitting more than one review per session index
reviewSchema.index({ session: 1, consumer: 1 }, { unique: true });

// Static method to average ratings and update the GPU document
reviewSchema.statics.getAverageRating = async function (gpuId) {
    const obj = await this.aggregate([
        {
            $match: { gpu: gpuId }
        },
        {
            $group: {
                _id: '$gpu',
                averageRating: { $avg: '$rating' },
                numReviews: { $sum: 1 }
            }
        }
    ]);

    try {
        if (obj[0]) {
            await this.model('GPU').findByIdAndUpdate(gpuId, {
                'rating.average': parseFloat(obj[0].averageRating.toFixed(1)),
                'rating.count': obj[0].numReviews
            });
        } else {
            await this.model('GPU').findByIdAndUpdate(gpuId, {
                'rating.average': 0,
                'rating.count': 0
            });
        }
    } catch (err) {
        console.error(err);
    }
};

// Call getAverageRating after saving a review
reviewSchema.post('save', function () {
    this.constructor.getAverageRating(this.gpu);
});

// Call getAverageRating before removing a review
reviewSchema.pre('remove', function () {
    this.constructor.getAverageRating(this.gpu);
});

const Review = mongoose.model('Review', reviewSchema);

export default Review;
