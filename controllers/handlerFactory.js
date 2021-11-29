const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

exports.deleteOne = ( Model ) => {
	return catchAsync(async(req, res, next) => {
		const doc = await Model.findByIdAndDelete(req.params.id);
		if (!doc) {
			return next(new AppError('No doc found wth this ID', 404));
		}
		res.status(204).json({
			status: 'Success',
			data: null
		});
	});	
}

exports.updateOne = ( Model ) => {
	return catchAsync(async (req, res, next) => {
		const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true});
		if (!doc) {
			return next(new AppError('No doc found wth this ID', 404));
		}
		res.status(200).json({
			status: 'Success',
			data: {
				data: doc
			}
		});
	});
}

exports.createOne = ( Model ) => {
	return catchAsync(async (req, res, next) => {
		const newDoc = await Model.create(req.body);
		res.status(201).json({
			status: 'Success',
			data: {
				data: newDoc
			}
		});
	});
}

exports.getOne = ( Model, populateOptions) => {
	return catchAsync(async (req, res, next) => {
		let query = Model.findById(req.params.id);
		if (populateOptions) {
			query = query.populate(populateOptions);
		}
		const doc = await query;
		if (!doc) {
			return next(new AppError('No doc found wth this ID', 404));
		}
		res.status(200).json({
			status: 'Success',
			data: {
				data: doc
			}
		});	
	});
}

exports.getAll = ( Model) => {
	return catchAsync(async (req, res, next) => {
		// to allow for nested get reviews on tour 
		const filterByTour = {};
		if (req.params.tourId) { filterByTour.tour = req.params.tourId; }
		/////////////////// (a hack)
		const feature = new APIFeatures(Model.find(filterByTour), req.query).filter().sort().limitFields().paginate();
		const docs = await feature.query;
		res.status(200).json({
			status: 'Success',
			data: {
				data: docs
			}
		});	
	});
}