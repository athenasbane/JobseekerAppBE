const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    company: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    link: {
        type: String,
        required: true,
    },
    source: { 
        type: String,
        required: true
    },
    dismissed: {
        type: Boolean,
        required: true,
        default: false   
    },
    applied: {
        type: Boolean,
        required: true,
        default: false
    },
    date: {
        type: Date,
        default: Date.now,
        required: false
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }

}, {
    timestamps: true
})

const Job = mongoose.model('Job', UserSchema)

module.exports = Job