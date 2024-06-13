const mongoose = require('mongoose');

const dietSchema = new mongoose.Schema({

    userId: { 
        type: String, required: true 
    },
    userName: { 
        type: String, required: true 
    },
    name: {
        type: String,
        required: true
    },
    recipes: {
        type: [[[String]]],
        default: [[[]]],   
        required: true
    },
    visible_recipes: {
        type: [[[Boolean]]],
        default: [[]],     
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    info: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Diet', dietSchema, 'Diets');
