const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const Users = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');
const crypto = require('crypto');

const signToken = (id) => {
	return jwt.sign({ id: id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN});
}

const createSendToken = (user, statusCode, res) => {
	const token = signToken(user._id);
	cookieOptions = {
		expires: new Date( Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
		httpOnly: true
	}
	if (process.env.NODE_ENVIRONMENT === 'production') { cookieOptions.secure = true; }
	res.cookie('jwt', token, cookieOptions);
	user.password = undefined;
	res.status(statusCode).json({
		status: 'success',
		token,
		data: {
			user
		}
	});	
}

exports.signUp = catchAsync(async (req, res, next) => {
	const newUser = await Users.create( req.body );
	const url = `${req.protocol}://${req.get('host')}/me`
	await new Email(newUser, url).sendWelcome();
	createSendToken(newUser, 201, res)
});

exports.logIn = catchAsync(async (req, res, next) => {
	const {email, password} = req.body;

	if (!email || !password) { return next(new AppError('Please enter the credentials', 400));}

	const user = await Users.findOne({ email: email}).select('+password');
	if (!email || !(await user.correctPassword(password, user.password))) {
		return next(new AppError('Wrong credentials', 401));
	} 

	createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
	res.cookie('jwt', 'justToDeleteTheExistingOne', {expires: new Date(Date.now() + 10000), httpOnly: true});
	res.status(200).json({ status: 'success'});
}

exports.protect = catchAsync(async (req, res, next) => {
	let token;
	// if header contains token
	if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
		token = req.headers.authorization.split(' ')[1];
	}
	else if (req.cookies) {
    	token = req.cookies.jwt;
  	}
	// is token is correct
	if (!token) {
		return next(new AppError('Need to login, Please login', 401));
	}
	const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
	// if user whose token is this still exists
	const checkUser = await Users.findById(decoded.id);
	if (!checkUser) {
		return next(new AppError(`Token user doesn't exist`, 401));
	}
	// check if password was changed after token issuance
	if (checkUser.changedPasswordAfter(decoded.iat)) {
		return next( new AppError('Password was changed recently! login again', 401));
	}
	req.user = checkUser;
	res.locals.user = checkUser;
	next();
});

// only for front end
exports.isLoggedIn = async (req, res, next) => {
	if (req.cookies.jwt) {
    try {
    	// 1) verify token
      const decoded = await promisify(jwt.verify)( req.cookies.jwt, process.env.JWT_SECRET);	
      
      // 2) Check if user still exists
      const currentUser = await Users.findById(decoded.id);
      if (!currentUser) { return next();}
      
      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) { return next();}

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
    	 return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
	return (req, res, next) => {
		if (!roles.includes(req.user.role)) {
			return next( new AppError('You do not have perrmission for that', 403));
		}
		next();
	}
}

exports.forgotPassword = catchAsync( async ( req, res, next,) => {
	// check if the email is correct
	const user = await Users.findOne( {email: req.body.email});
	if (!user) {
		return next ( new AppError('no user with this email id', 404));
	}
	// generate the reset token
	const resetToken = user.createPasswordResetToken();
	await user.save();
	// send rest token vai mail
	try {
		const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetpassword/${resetToken}`;
		await new Email(user, resetURL).sendPasswordReset();
		res.status(200).json({
			status: 'Success',
			message: 'Token is sent on your email'
		});
	} catch (err) {
		user.passwordResetToken = undefined;
		user.passwordResetExpires = undefined;
		await user.save();
		return next( new AppError('There was an error sending the email, try again later', 500));
	}
});

exports.resetPassword = catchAsync( async ( req, res, next) => {
	// check if specified reset token is assigned to any user or not and if it has expired
	const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
	const user = await Users.findOne({passwordResetToken: hashedToken, passwordResetExpires: {$gte: Date.now()}})
	// check is user exists or token is still valid
	if (!user) { return next( new AppError('Token is invalid or has expired', 400));}
	user.password = req.body.password;
	user.passwordConfirm = req.body.passwordConfirm;
	user.passwordResetToken = undefined;
	user.passwordResetExpires = undefined;
	await user.save();
	//set the password chabge timestamp
	//send the response
	createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync( async ( req, res, next) => {
	//check if email exists also with current given password
	const user = await Users.findById(req.user.id).select('+password');
	if ( !await user.correctPassword(req.body.currentPassword, user.password)) { return next(new AppError('Wrong credentials', 401));}
	// update the new password
	user.password = req.body.newPassword;
	user.passwordConfirm = req.body.newPasswordConfirm
	await user.save();
	//send response
	createSendToken(user, 200, res);
})