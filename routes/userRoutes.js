const express = require('express');
const authenticationControllers = require('./../controllers/authenticationControllers');
const userControllers = require('./../controllers/userControllers');

const router = express.Router();


router.route('/signup').post(authenticationControllers.signUp);
router.route('/login').post(authenticationControllers.logIn);
router.route('/logout').get(authenticationControllers.logout);
router.route('/forgotPassword').post(authenticationControllers.forgotPassword);
router.route('/resetPassword/:token').patch(authenticationControllers.resetPassword);

router.use(authenticationControllers.protect)

router.route('/updatePassword').patch(authenticationControllers.updatePassword);
router.route('/updateMe').patch(userControllers.uploadUserPhoto, userControllers.resizeUserPhoto, userControllers.updateMe);
router.route('/deleteMe').delete(userControllers.deleteMe);
router.route('/getMe').get(userControllers.getMe, userControllers.getUser);

router.use(authenticationControllers.restrictTo('admin'));

router.route('/')
				.get(userControllers.getAllUsers)
				.post(userControllers.createUser);

router.route('/:id')
					.get(userControllers.getUser)
					.patch(userControllers.updateUser)
					.delete(userControllers.deleteUser);

module.exports = router;