const slugify = require('slugify');
//const validator = require('validator');
//const Users = require('./userModel');
const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, 'A Tour must have a name'],
		unique: true,
		trim: true,
		maxlength: [50, 'Name length should be less or equal to 50 char'],
		minlength: [10, 'Name length should be more or equal to 10 char']
	},
	slug: {
		type: String,
		trim: true
	},
	duration: {
		type: Number,
		required: [true, 'A tour must have a duration']
	},
	maxGroupSize: {
		type: Number,
		required: [true, 'A tour must have a group size']
	},
	difficulty: {
		type: String,
		required: [true, 'A tour must have a difficulty'],
		enum: { values: ['easy', 'medium', 'difficult'], message: 'Difficulty is either easy, medium or difficult'}
	},
	ratingsAverage: {
		type: Number,
		default: 4.5,
		min: [1, 'rating should be more or equal to 1.0'],
		max: [5, 'rating should be less or equal to 5.0'],
		set: (val) => { return Math.round(val * 10) / 10;}
	},
	ratingsQuantity: {
		type: Number,
		default: 0
	},
	price: {
		type: Number,
		required: [true, 'A Tour must have a price']
	},
	priceDiscount: {
		type: Number,
		validate: {
			validator: function (value) {
				return value < this.price;
			},
		message: 'Discount price ({VALUE}) should be below regular price'	
		}
	},
	summary: {
		type: String,
		trim: true,
		required: [true, 'A Tour must have a summary']
	},
	description: {
		type: String,
		trim: true
	},
	imageCover: {
		type: String,
		required: [true, 'A Tour must have a image cover']
	},
	images: [String],
	createdAt: {
		type: Date,
		default: Date.now(),
		select: false
	},
	startDates: [Date],
	secretTour: {
		type: Boolean,
		default: false
	},
	startLocation: {
		// GeoJSON
	    type: {
	    	type: String,
	        default: 'Point',
	        enum: ['Point']
	    },
	    coordinates: [Number],
	    address: String,
	    description: String
    },
    locations: [
    	{
    		type: {
    			type: String,
          		default: 'Point',
          		enum: ['Point']
        	},
        	coordinates: [Number],
        	address: String,
        	description: String,
        	day: Number
      	}
    ],
    guides: [
    	{
    		type: mongoose.Schema.ObjectId,
    		ref: 'User'
    	}
    ]
},
{
	toJSON: { virtuals: true},
	toObject: { virtuals: true}
});

tourSchema.virtual('durationInWeek').get(function() {
	return this.duration / 7;
});

tourSchema.virtual('reviews', {
	ref: 'Review',
	localField: '_id',
	foreignField: 'tour'
});

tourSchema.index({price: 1, ratingsAverage: -1});
tourSchema.index({slug: 1});
tourSchema.index({startLocation: '2dsphere'});

// document middleware
tourSchema.pre('save', function(next) {                    //works only on save() and create()
	this.slug = slugify(this.name, {lower: true});
	next();
});

//tourSchema.pre('save', async function(next) {
//	const guidesPromises = this.guides.map( (id) =>  { return Users.findById(id);});
//	this.guides = await Promise.all(guidesPromises);
//	next();
//});

//query middleware
//tourSchema.pre(/^find/, function(next) {                    //works only on query function starting with find
//	this.find({secretTour: {$ne: true}});
//	next();
//});

tourSchema.pre(/^find/, function(next) {                    //works only on query function starting with find
	this.populate({ path: 'guides', select: '-__v -passwordChangedAt'});
	next();
});

// aggregation middleware
//tourSchema.pre('aggregate', function(next) {
//	this.pipeline().unshift({ $match: { secretTour: {$ne: true}}});
//	next();
//})

const Tours = mongoose.model('Tour', tourSchema);

module.exports = Tours;