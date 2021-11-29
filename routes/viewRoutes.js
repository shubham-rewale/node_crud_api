const express = require('express');
const viewControllers = require('./../controllers/viewControllers')
const bookingControllers = require('./../controllers/bookingControllers')
const authenticationControllers = require('./../controllers/authenticationControllers');

const router = express.Router();


router.route('/').get(bookingControllers.createBookingCheckout, authenticationControllers.isLoggedIn, viewControllers.getOverview);
router.route('/tour/:slug').get(authenticationControllers.isLoggedIn, viewControllers.getTourDetails);
router.route('/login').get(authenticationControllers.isLoggedIn, viewControllers.getLoginForm);
router.route('/me').get(authenticationControllers.protect, viewControllers.getAccount);
router.route('/my-tours').get(authenticationControllers.protect, viewControllers.getMyTours);

//router.route('/submit-user-data').post(authenticationControllers.protect, viewControllers.updateUserData);

module.exports = router;