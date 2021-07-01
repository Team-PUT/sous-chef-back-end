const axios = require('axios');

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

let handleLogin = (req, res) => {
  // grab the token that was sent by the frontend
  const token = req.headers.authorization.split (' ')[1];
  // make sure the token is valid
  jwt.verify (token, getKey, {}, function (err, user) {
    if (err) {
      res.status (500).send ('invalid token');
    } else {
      res.send (user);
    }
  });
};

let createRecipes = (data) => {
  return data.map(outerArr => {
    return outerArr.map(recipe => {
      let newRecipe = new Recipe({
        name: recipe.recipe.label,
        link: recipe.recipe.url,
        image: recipe.recipe.image,
        source: recipe.recipe.source,
        ingredients: recipe.recipe.ingredientLines,
        matches: 0,
        email: ''
      });
      return newRecipe;
    });
  });
};

let searchForRecipes = async(req, res) => {
  console.log('route is working');

  //receive an array of strings back, make one API call per string. Store the response with createRecipes and add it to an array.
  //Check how many ingredients in RecipeArr[i].ingredients matches your string list of ingredients, tally the total and send the data back from high to low (sort the array of recipes)

  let ingredients = req.query.ingredients;

  let ingrArr = JSON.parse(ingredients);

  let arrOfResponses = await Promise.all(ingrArr.map(ingredient => {
    return axios.get(`https://api.edamam.com/api/recipes/v2?type=public&q=${ingredient}&app_id=${process.env.EDEMAM_ID}&app_key=${process.env.EDEMAM_KEY}`);
  }));

  let rawRecipeArr = arrOfResponses.map(x => x.data.hits.slice(0, 12));

  let refinedRecipeArr = createRecipes(rawRecipeArr);

  let finalRecipeArr = [];

  refinedRecipeArr.forEach(outerArr => {
    outerArr.forEach(recipe => {
      finalRecipeArr.push(recipe);
    });
  });

  finalRecipeArr.forEach(recipe => {
    for (let i = 0; i < ingrArr.length; i++) {
      console.log(ingrArr[i]);
      recipe.ingredients.includes(ingrArr[i]) ? recipe.matches += 1 : recipe.matches;
    }
    recipe.save();
  });

  res.send(finalRecipeArr);
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

module.exports = {searchForRecipes, generateProfileRecipes, assignRecipe, handleLogin};

