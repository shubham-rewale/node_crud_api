const express = require('express');
const fs = require('fs');

const reviewRouter = require('./../routes/reviewRoutes');
const tourControllers = require('./../controllers/tourControllers');
const authenticationControllers = require('./../controllers/authenticationControllers');

const router = express.Router();

//router.param('id', tourControllers.checkID);

router.use('/:tourId/reviews', reviewRouter);

router.route('/monthly-plan/:year').get(authenticationControllers.protect,
					  					authenticationControllers.restrictTo('admin', 'lead-guide', 'guide'),
					  					tourControllers.getMonthlyPlan);

router.route('/tours-stats').get(tourControllers.getTourStats);

router.route('/top-5-saste').get(tourControllers.aliasTopTours, tourControllers.getAllTours);

router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(tourControllers.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourControllers.getDistances);

router.route('/')
				.get(tourControllers.getAllTours)
				.post(authenticationControllers.protect,
					  authenticationControllers.restrictTo('admin', 'lead-guide'),
					  tourControllers.createTour);

router.route('/:id')
					.get(tourControllers.getTour)
					.patch(authenticationControllers.protect,
						   authenticationControllers.restrictTo('admin', 'lead-guide'),
						   tourControllers.uploadTourImages,
						   tourControllers.resizeTourImages,
						   tourControllers.updateTour)
					.delete(authenticationControllers.protect,
						     authenticationControllers.restrictTo('admin', 'lead-guide'),
						     tourControllers.deleteTour);


module.exports = router;