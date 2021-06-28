const Recipe = require('./models/Recipe');



let searchForRecipes = (req, res) => {
  res.send('searching for recipes..');
};

let unSaveRecipe;

//creating an allRecipes object and exporting the functions.
module.exports = {
  allRecipes: allRecipes, searchForRecipes
};
