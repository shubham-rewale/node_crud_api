const Reviews = require('./../models/reviewModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const handlerFactory = require('./handlerFactory');

// getting reviews under a tour and for getting all the reviews
exports.getReviews = handlerFactory.getAll(Reviews);

// getting review with perticular review id
exports.getReview = handlerFactory.getOne(Reviews);

exports.setReviewData = (req, res, next) => {
	if ( !req.body.tour) { req.body.tour = req.params.tourId; }
	if ( !req.body.user) { req.body.author = req.user.id; }
	next();
}
exports.createReview = handlerFactory.createOne(Reviews);

exports.updateReview = handlerFactory.updateOne(Reviews);

exports.deleteReview = handlerFactory.deleteOne(Reviews);

exports.deleteAllReviews = catchAsync( async ( req, res, next) => {
	res.status(500).json({
		status: 'error',
		message: 'this route is not yet implemented'
	});
});