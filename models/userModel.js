const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, 'Username is a mandatory field'],
		trim: true,
		maxlength: [25, 'Username should be less or equal to 50 characters']
	},
	email: {
		type: String,
		required: [true, 'email is a mandatory field'],
		unique: [true, 'id already exists'],
		trim: true,
		lowercase: true,
		validate: [validator.isEmail, 'Ths is an invalid email']
	},
	photo: {
		type: String,
		defaut: 'default.jpg'
	},
	role: {
		type: String,
		enum: ['admin', 'guide', 'lead-guide', 'user'],
		default: 'user'
	},
	password: {
		type: String,
		required: [true, 'password is a mandatory field'],
		trim: true,
		select: false,
		minlength: [8, 'password should be minimum 8 characters long'],
	},
	passwordConfirm: {
		type: String,
		required: [true, 'password is a mandatory field'],
		trim: true,
		select: false,
		validate: {
			validator: function(value) {
				return value === this.password;
			},
			message: `password didn't match`
		}
	},
	passwordChangedAt: {
		type: Date
	},
	passwordResetToken: String,
	passwordResetExpires: Date,
	active: {
		type: Boolean,
		default: true,
		select: false
	}
});

userSchema.pre('save', async function(next) {
	if (!this.isModified('password')) return next();
	this.password = await bcrypt.hash(this.password, 12);
	this.passwordConfirm = undefined;
	next();
});

userSchema.pre('save', function(next) {
	if (!this.isModified('password') || this.isNew) return next();
	this.passwordChangedAt = Date.now() - 1000;
	next();
});

userSchema.pre(/^find/, function(next) {
	//this is query middleware
	this.find({ active: { $ne: false}});
	next();
});

userSchema.methods.correctPassword = function (inputPassword, storedPassword) {
	return bcrypt.compare(inputPassword, storedPassword);
}

userSchema.methods.changedPasswordAfter = function (tokenTimeStamp) {
	if (this.passwordChangedAt) {
		const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
		return tokenTimeStamp < changedTimestamp;
	}
	return false
}

userSchema.methods.createPasswordResetToken = function () {
	const resetToken = crypto.randomBytes(32).toString('hex');
	this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
	this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
	return resetToken;
}

const Users = mongoose.model('User', userSchema);

module.exports = Users;