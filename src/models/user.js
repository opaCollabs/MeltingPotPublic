const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'Please add a password']
    },
    role: {
        type: String,
        enum: ['admin', 'nutritionist', 'user'],
        default: 'user'
    },
    imageUrl: String,
    fileUrl: String,
    cookScore: {
        type: Number,
        required: false
    },
    categories: {
        type: [String],
        default: []
    },
    recipesILiked: {
        type: [String],
        default: []
    },
    savedRecipes: { 
        type: [String],
        default: []
    },
    purchasedDiets: {
        type: [String],
        default: []
    }
});

module.exports = mongoose.model('User', userSchema, 'Users');

