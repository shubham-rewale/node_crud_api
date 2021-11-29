const express = require('express');
const reviewControllers = require('./../controllers/reviewControllers');
const authenticationControllers = require('./../controllers/authenticationControllers');

const router = express.Router({mergeParams: true});

router.use(authenticationControllers.protect);

router.route('/').get(reviewControllers.getReviews)
				 .post(authenticationControllers.restrictTo('user'),
				 	   reviewControllers.setReviewData,
				 	   reviewControllers.createReview);

router.route('/:id').get(reviewControllers.getReview)
					.patch(authenticationControllers.restrictTo('user', 'admin'), reviewControllers.updateReview)
					.delete(authenticationControllers.restrictTo('user', 'admin'), reviewControllers.deleteReview);

router.route('/deleteAllReview').delete(reviewControllers.deleteAllReviews);

module.exports = router;