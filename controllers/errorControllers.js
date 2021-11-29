const AppError = require('./../utils/appError');

const handleJWTError = () => {
	return new AppError('Invalid json web token! login again', 401);
}

const handleJWTExpirationError = () => {
	return new AppError('token has expired! login again', 401);
}

const handleValidationErrorDB = (err) => {
	errorMsg = Object.values(err.errors).map((el) => { return el.message})
	message = `Invalid data input. ${errorMsg.join('. ')}`;
	return new AppError(message, 400);
}

const handleDuplicatFieldsDB = (err) => {
	const value = err.keyValue.name;
	const message = `Duplicate field: ${value} . Please use another value`;
	return new AppError(message, 400);
}

const handleCasteErrorDB = (err) => {
	const message = `Invalid ${err.path}: ${err.value}`;
	return new AppError(message, 400);
}

const sendErrorProd = (err, res, req) => {
	// for api
	if (req.originalUrl.startsWith('/api')) {
		if (err.isOperational) {
			return res.status(err.statusCode).json({
				status: err.status,
				message: err.message
			});
		}
		console.error('ERROR 💥', err);
		return res.status(500).json({
			status: 'Error',
			message: 'Something went wrong'
		});
	}
	// for rendered website
	if (err.isOperational) {
		return res.status(err.statusCode).render('error', {
			title: 'Somethig went wrong',
			message: err.message
		});
	}
	console.error('ERROR 💥', err);
	return res.status(500).render('error', {
		title: 'Somethig went wrong',
		message: 'please try again later'
	});
}

const sendErrorDev = (err, res, req) => {
	// for api
	if (req.originalUrl.startsWith('/api')) {
		return res.status(err.statusCode).json({
			status: err.status,
			error: err,
			message: err.message,
			stack: err.stack
		});
	}
	// for rendered websites
	console.error('ERROR 💥', err);
	return res.status(err.statusCode).render('error', {
		title: 'Somethig went wrong',
		message: err.message
	});
}

module.exports = (err, req, res, next) => {
	err.statusCode = err.statusCode || 500;
	err.status = err.status || 'error';

	if (process.env.NODE_ENVIRONMENT === 'development') {
		sendErrorDev(err, res, req);
	} else if (process.env.NODE_ENVIRONMENT === 'production') {
		let error = JSON.parse(JSON.stringify(err));
		error.message = err.message;
		if ( error.name === 'CastError') { error = handleCasteErrorDB(error);}
		if ( error.code === 11000) { error = handleDuplicatFieldsDB(error);}
		if ( error.name === 'ValidationError') { error = handleValidationErrorDB(error);}
		if ( error.name === 'JsonWebTokenError') { error = handleJWTError();}
		if ( error.name === 'TokenExpiredError') { error = handleJWTExpirationError();}

		sendErrorProd(error, res, req);
	}
}