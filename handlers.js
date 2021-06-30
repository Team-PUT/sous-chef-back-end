const axios = require('axios');
const mongoose = require('mongoose');

//Authoriztion from AuthO website.
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient ({
  jwksUri: 'https://1206.us.auth0.com/.well-known/jwks.json'
});

function getKey (header, callback) {
  client.getSigningKey (header.kid, function (err, key) {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback (null, signingKey);
  });
}
// --------------------------------

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

let generateProfileRecipes = async(req, res) => {
  const token = req.headers.authorization.split (' ')[1];
  //make sure token was valid
  jwt.verify (token, getKey, {}, function (err, user) {
    if (err) {
      res.status (500).send ('invalid token');
    }
    else {
      let userEmail = user.email;
      Recipe.find ({email: userEmail}, (err, recipes) => {
        console.log (recipes);
        res.send (recipes);
      });
    }
  });
};

let assignRecipe = async(req, res) => {
  const token = req.headers.authorization.split (' ')[1];
  //make sure token was valid
  jwt.verify (token, getKey, {}, function (err, user) {
    if (err) {
      res.status (500).send ('invalid token');
    }
    else {
      Recipe.findOne({
        _id: req.params.id,
      }).then(foundRecipe => {
        foundRecipe.email = user.email;
        //send saved Recipe to client
        foundRecipe.save().then(savedRecipe => res.send(savedRecipe));
      });
    }
  });
};

module.exports = {searchForRecipes, generateProfileRecipes, assignRecipe};

