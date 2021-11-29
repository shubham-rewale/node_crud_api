const fs = require('fs');
const Tours = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const handlerFactory = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');

//const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));


const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
	if (file.mimetype.startsWith('image')) {
		cb(null, true);
	} else {
		cb(new AppError('Not an Image! Only image can be upload!', 400), false);
	}
}

const upload = multer({ storage: multerStorage, fileFilter: multerFilter});

exports.uploadTourImages = upload.fields([
		{ name: 'imageCover', maxCount: 1},
		{ name: 'images', maxCount: 3}
	]);

exports.resizeTourImages = catchAsync( async (req, res, next) => {
	if (!req.files.imageCover || !req.files.images) return next();

	// 1) Cover image
	req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
	await sharp(req.files.imageCover[0].buffer)
	.resize(2000, 1333).toFormat('jpeg').jpeg({ quality: 90 }).toFile(`public/img/tours/${req.body.imageCover}`);

	// 2) Images
	req.body.images = [];

	await Promise.all(req.files.images.map(async (file, i) => {
			const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
			await sharp(file.buffer).resize(2000, 1333).toFormat('jpeg').jpeg({ quality: 90 }).toFile(`public/img/tours/${filename}`);
			req.body.images.push(filename);
		})
	);
	
	next();
});

exports.aliasTopTours = (req, res, next) => {
	req.query.limit = '5';
	req.query.sort = '-ratingsAverage,price';
	req.query.fields = 'name,price,ratingsAverage,summary,difficulty,duration';
	next();
}

exports.getAllTours = handlerFactory.getAll(Tours)

exports.getTour = handlerFactory.getOne(Tours, { path: 'reviews', select:'review rating _id createdAt user'});

exports.createTour = handlerFactory.createOne(Tours);

exports.updateTour = handlerFactory.updateOne(Tours);

exports.deleteTour = handlerFactory.deleteOne(Tours);

exports.getTourStats = catchAsync(async (req, res, next) => {
	const stats = await Tours.aggregate([
			{$match: { ratingsAverage: {$gte: 4.5}}},
			{$group: { _id: '$difficulty',
			           numberOfTours: { $sum: 1}, 
			           numberOfReviews: { $sum: '$ratingsQuantity'},
			           averageRating: { $avg: '$ratingsAverage'},
			           averagePrice: { $avg: '$price'},
			           maximumPrice: { $max : '$price'},
			           minimumPrice: { $min : '$price'}}},
			{$sort: { averagePrice: 1}}
		])
	res.status(200).json({
		status: 'Success',
		data: stats
	});
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
	const year = req.params.year * 1;
	const monthlySchedule = await Tours.aggregate([
		{ $unwind: '$startDates'},
		{ $match: { startDates: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`)}}},
		{ $group: { _id: { $month: '$startDates'}, numberOfToursStart: { $sum: 1}, tours: { $push: '$name'}}},
		{ $addFields: { month: '$_id'}},
		{ $project: { _id: 0}},
		{ $sort: { numberOfToursStart: -1}}
	])
	res.status(200).json({
		status: 'Success',
		data: monthlySchedule
	});
});

exports.getToursWithin = catchAsync( async ( req, res, next) => {
	const { distance, latlng, unit} = req.params;
	const [ lat, lng] = latlng.split(',');
	const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

	if ( !lat || !lng) { return next( new AppError('Please provide latitude and longitude in the format lat lng', 400));}

	const tours = await Tours.find( { startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius]}}});

	res.status(200).json({
		status: 'success',
		result: tours.length,
		data: {
			tours: tours
		}
	})
})

exports.getDistances = catchAsync( async (req, res, next) => {
	const { latlng, unit } = req.params;
  	const [lat, lng] = latlng.split(',');

  	const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  	if (!lat || !lng) { next( new AppError('Please provide latitutr and longitude in the format lat,lng.', 400));}

	const distances = await Tours.aggregate([
		{ $geoNear: {
			near: {
				type: 'Point',
	          	coordinates: [lng * 1, lat * 1]
	        },
	        distanceField: 'distance',
	        distanceMultiplier: multiplier
	    	}
	    },
	    { $project: {
	    	distance: 1,
	        name: 1
	      	}
	    }
	]);

  	res.status(200).json({
    	status: 'success',
    	data: {
      		data: distances
    	}
  	});
});
