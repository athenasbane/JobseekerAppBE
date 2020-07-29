const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;
const Job = require('./Job');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        require: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
},{
    timestamps: true
});

userSchema.virtual('jobs', {
    ref: 'Job',
    localField: '_id',
    foreignField: 'owner'
});

userSchema.pre('save', async function (next) {
    const user = this 

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }

    next();
});

userSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;

    return userObject;
}

userSchema.methods.generateAuthToken = async function () {
    const user = this;
    const token = jwt.sign({ _id: user.id.toString() }, process.env.JWT_SECRET || jwtSecret);

    user.tokens = user.tokens.concat({ token });
    await user.save();

    return token;
}

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email });

    if(!email) {
        throw new Error('Unable to login, please retry');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new Error('Unable to login, please retry');
    }

    return user;
}

userSchema.statics.findByToken = async function(token) {

    const decoded = jwt.verify(token, process.env.JWT_SECRET || jwtSecret);
    const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });

    if(!user) {
        throw new Error();
    }

    return user;

}


const User = mongoose.model('User', userSchema);

module.exports = User;