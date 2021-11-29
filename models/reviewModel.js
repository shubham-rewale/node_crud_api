const mongoose = require('mongoose');
const Tours = require('./tourModel');

const reviewSchema = new mongoose.Schema({
	review: {
		type: String,
		required: [true, 'review can not be empty']
	},
	rating: {
		type: Number,
		min: 1,
		max: 5
	},
	createdAt: {
		type: Date,
		default: Date.now()	
	},
	tour: {
		type: mongoose.Schema.ObjectId,
		ref: 'Tour',
		require: [true, 'review must belong to a tour']
	},
	user: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
		require: [true, 'review must have an author']
	}
},
{
	toJSON: { virtuals: true},
	toObject: { virtuals: true}
});

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
	this./*populate({ path: 'tour', select: 'name'}).*/populate({ path: 'user', select: 'name photo -_id'});
	next();
});

reviewSchema.statics.calcAverageRatings = async function(tourId) {
	const ratingStats = await this.aggregate([
		{$match: {tour: tourId}},
		{$group: {
			_id: '$tour',
			nRating: {$sum: 1},
			avgRating: {$avg: '$rating'}
		}}
	]);
	if (ratingStats) {
		await Tours.findByIdAndUpdate(tourId, {
			ratingsAverage: ratingStats[0].avgRating,
			ratingsQuantity: ratingStats[0].nRating
		});	
	}
}

reviewSchema.pre('save', function() {
	// this.constructor points to model itself
	this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function(next) {
	this.r = await this.findOne();
	next();
});

reviewSchema.post(/^findOneAnd/, async function() {
	await this.r.constructor.calcAverageRatings(this.r.tour); 
});

const Reviews = mongoose.model('Review', reviewSchema);

module.exports = Reviews;