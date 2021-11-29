const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({path: './config.env'});
const app = require('./app');


process.on('unhandledRejection', (err) => {
	console.log('Unhandled Rejection... Shutting Down')
	console.log(err.name, err.message)
	process.exit(1);
});

process.on('uncaughtException', (err) => {
	console.log('Uncaught Exception... Shutting Down')
	console.log(err)
	process.exit(1);
});

mongoose.connect(process.env.DATABASE, {
	useNewUrlParser: true,
	useCreateIndex: true,
	useFindAndModify: false
}).then((con) => { console.log('DB Connection is Successful');});

const port = process.env.PORT || 3000;

app.listen(port, () => {
	console.log(`App is listening on port ${port}`);
});
