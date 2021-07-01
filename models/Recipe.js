const mongoose = require('mongoose');

const recipeScehma = new mongoose.Schema({
  name: String,
  link: String,
  image: String,
  source: String,
  ingredients: Array,
  matches: Number,
  matchArray: Array,
  email: String
});

const Recipe = mongoose.model('Recipe', recipeScehma);

//send off the recipe model to be constructed by the handler functions.
module.exports = Recipe;

