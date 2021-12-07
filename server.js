'use strict';

//creating the express app to use the server.
const express = require('express');
const app = express();
app.use(express.json());

require ('dotenv').config();

const cors = require('cors');
app.use(cors ());

const PORT = process.env.PORT || 3001;

// ---------------------------------
// MongoDB config - connecting to the database

const mongoose = require('mongoose');
mongoose.connect(process.env.DATABASE_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// quickstart;
const db = mongoose.connection;
db.on ('error', console.error.bind (console, 'connection error:'));
db.once ('open', function () {
  console.log ('connection successful for mongoDB');
});

// ----------------------------------
// Allows someone to search for a specific function within the handlers folder. This function is then called based on the action performed below.
let handlers = require('./handlers');

// Port pathways (docks) to front end.
app.get('/', (req, res) => {
  res.send('Server is working!');
});

app.get('/login', handlers.handleLogin);

app.get('/searchIngredients', handlers.searchForRecipes);

app.get('/profileRecipes', handlers.generateProfileRecipes);

app.put('/update/:id', handlers.assignRecipe);

app.delete('/delete/:id', handlers.deleteRecipe);


app.listen(PORT, () => console.log(`listening on port ${PORT}`));


