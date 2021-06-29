const mongoose = require('mongoose');

const recipeScehma = new mongoose.Schema({
  name: String,
  link: String,
  image: String,
  source: String,
  ingredients: Array
});

const Recipe = mongoose.model('Recipe', recipeScehma);

//send off the recipe model to be constructed by the handler functions.
module.exports = Recipe;

