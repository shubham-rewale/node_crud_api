const Tours = require('./../models/tourModel');
const Bookings = require('./../models/bookingModel');
const Users = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');


exports.getOverview = catchAsync( async (req, res, next) => {
	const tours = await Tours.find();

	res.status(200).render('overview', {
		title: 'All Tours Overview',
		tours
	});
});

exports.getTourDetails = catchAsync( async (req, res,  next) => {
	const {slug} = req.params
	const tour = await Tours.findOne({ slug: { $eq: slug}}).populate({path: 'reviews', field:'review rating user'});

	if (!tour) {
		return next( new AppError('There is no tour with that name', 404));
	}

	res.status(200).render('tour', {
		title: tour.name,
		tour
	});
});

exports.getLoginForm = catchAsync( async (req, res) => {
	res.status(200).render('login', {
		title: 'Log In to your Account'
	});
});

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account'
  });
};

exports.getMyTours = catchAsync( async (req, res) => {
	const bookings = await Bookings.find({user: req.user.id});
	const tourIds = bookings.map((el) => { return el.tour});
	const tours = await Tours.find({ _id: { $in: tourIds}});
	res.status(200).render('overview', {
		title: 'My Tours',
		tours
	});
});


//exports.updateUserData = async (req, res) => {
//	const updatedUser = await Users.findByIdAndUpdate(req.user.id, { name: req.body.name, email: req.body.email}, {new: true, runValidators:true});
//	res.status(200).render('account', {
//   title: 'Your account',
//    user: updatedUser
// });
//}