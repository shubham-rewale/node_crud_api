const mongoose = require('mongoose');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config({path: './config.env'});
const Tours = require('./../../models/tourModel');
const Users = require('./../../models/userModel');
const Reviews = require('./../../models/reviewModel');

mongoose.connect(process.env.DATABASE, {
	useNewUrlParser: true,
	useCreateIndex: true,
	useFindAndModify: false
}).then((con) => { console.log('DB Connection is Successful');});

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));

const uploadingDataToDB = async () => {
	try {
		await Tours.create(tours);
		await Users.create(users, { validateBeforeSave: false });
		await Reviews.create(reviews);
		console.log('Successful Creation');
	}catch (err) { console.log(err);}
	process.exit();
}

const deletingDataFromDB = async () => {
	try {
		await Tours.deleteMany();
		await Users.deleteMany();
		await Reviews.deleteMany();
		console.log('Successful Deletion');
	}catch (err) { console.log(err);}
	process.exit();
}


if (process.argv[2] === '--delete') {
	deletingDataFromDB();
}
else if (process.argv[2] === '--upload') {
	uploadingDataToDB();
}