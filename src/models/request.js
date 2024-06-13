const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: [true, 'Please add a user ID']
    },
    username: {
        type: String,
        required: [true, 'Please add a username']
    },
    fileUrl: {
        type: String,
        required: [true, 'Please add a file URL']
    }
});

module.exports = mongoose.model('Request', requestSchema, 'Requests');