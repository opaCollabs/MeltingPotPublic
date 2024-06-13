const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    quantity: { type: String, required: true }
});

const recipeSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    name: { type: String, required: true },
    imageUrl: { type: String },
    description: { type: String, required: true },
    ingredients: [ingredientSchema],
    instructions: { type: String, required: true },
    categories: { type: [String], required: true },
    hearts: {type: Number, required: false},
});

const Recipe = mongoose.model('Recipe', recipeSchema, 'Recipes');

module.exports = Recipe;


