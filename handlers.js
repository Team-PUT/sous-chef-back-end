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
  console.log(req.body);
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
        matchArray: [],
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

  let rawRecipeArr = arrOfResponses.map(x => x.data.hits.slice(0, 15));
  let refinedRecipeArr = createRecipes(rawRecipeArr);
  // there's a JS method for this, .flat!
  let finalRecipeArr = refinedRecipeArr.flat();
  // let finalRecipeArr = [];

  // refinedRecipeArr.forEach(outerArr => {
  //   outerArr.forEach(recipe => {
  //     finalRecipeArr.push(recipe);
  //   });
  // });

  // congrats on your O(n^3) algorithm :P
  // in all seriousness, though, this is a reasonable way of calculating this.
  finalRecipeArr.forEach(recipe => {
    for (let i = 0; i < ingrArr.length; i++) {
      recipe.ingredients.forEach(ingredient => {
        let lowerCase = ingredient.toLowerCase();
        if (lowerCase.includes(ingrArr[i].toLowerCase())) {
          recipe.matches += 1;
          // do the de-duping on the backend
          if (!recipe.matchArray.includes(ingrArr[i])) {
            recipe.matchArray.push(ingrArr[i]);
          }
        }
      });
    }
    // Since you're saving all recipes found, your database size is going to grow much faster than it needs to,
    // full of recipes that will never be seen again. To make it work with this model, you'd need to have a job
    // set up to periodically go through the database and delete old entries without an associated email.
    // Or, the other way to implement this would be to not save to the database at all until the user hits the
    // save button on the frontend, and send a whole POST request with all the data.
    recipe.save();
  });

  finalRecipeArr.sort((recipeA, recipeB) => recipeB.matches - recipeA.matches);

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
  // this is using a slightly different way of accessing the headers than all the others... why?
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
        // this means that I can "steal" your recipe to my account if I guess its id.
        // you should probably also make sure that the email address associated with the recipe is null
        // before doing this assignment.
        foundRecipe.email = user.email;
        //send saved Recipe to client
        foundRecipe.save().then(savedRecipe => res.send(savedRecipe));
      });
    }
  });
};

let deleteRecipe = async(req, res) => {
  console.log('delete', req.headers.authorization);
  const token = req.headers.authorization.split (' ')[1];
  jwt.verify (token, getKey, {}, function (err, user) {
    if (err) {
      res.status (500).send ('invalid token');
    } else {
      let RecipeId = req.params.id;
      Recipe.deleteOne ({
        _id: RecipeId,
        email: user.email,
        // lol bookData
      }).then (deletedBookData => {
        console.log (deletedBookData);
        res.send ('Your Recipe Was Unsaved.');
      });
    }
  });
};

module.exports = {searchForRecipes, generateProfileRecipes, assignRecipe, handleLogin, deleteRecipe};

