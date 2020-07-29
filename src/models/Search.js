const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
    },
    jobs: {
        type: Array,
        required: false
    }
});

const Search = mongoose.model('Search', UserSchema);

module.exports = Search;