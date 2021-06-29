const axios = require('axios');
const mongoose = require('mongoose');

const Recipe = require('./models/Recipe');



let createRecipes = (data) => {

  let recipeArr = [];

  for (let i = 0; i < 20; i++) {
    const newRecipe = new Recipe({
      name: data[i].recipe.label,
      link: data[i].recipe.url,
      image: data[i].recipe.image,
      source: data[i].recipe.source,
      ingredients: data[i].recipe.ingredientLines
    });
    recipeArr.push(newRecipe);
  }
  return recipeArr;
};

let searchForRecipes = async(req, res) => {
  console.log('route is working');

  let ingredients = req.query.ingredients;
  let response = await axios.get(`https://api.edamam.com/api/recipes/v2?type=public&q=${ingredients}&app_id=${process.env.EDEMAM_ID}&app_key=${process.env.EDEMAM_KEY}`);
  let recipeArr = createRecipes(response.data.hits);

  res.send(recipeArr);
};

module.exports = {searchForRecipes};

