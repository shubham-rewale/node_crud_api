const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const universalErrorHandler = require('./controllers/errorControllers')
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

/// Middlewares ////////////////////////////////////
const limiter = rateLimit({
	windowMs: 60 * 60 * 1000,
	max: 100,
	message: 'Too many requests from this IP. Please try again in an hour'
})
app.use('/api', limiter);

app.use(helmet({contentSecurityPolicy: false,}));

app.use(express.json( {limit:'10kb'}));

app.use(express.urlencoded({ extended: true, limit: '10kb'}));

app.use(cookieParser());

app.use(mongoSanitize());

app.use(xss());

app.use(hpp( { whitelist: ['duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price']}));

if (process.env.NODE_ENVIRONMENT === 'development') {
	app.use(morgan('dev'));	
}

app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
	req.requestTime = new Date().toISOString();
	next();
});

/// Handlers ///////////////////////////////////////


/// Routes //////////////////////////////////////////
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
	next(new AppError(`The URL '${req.originalUrl}' is not valid`, 404));
});

app.use(universalErrorHandler);

/// Start the Server //////////////////////////
module.exports = app;