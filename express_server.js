const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

const userDatabase = {};

//-------HELPERS-------\\
function generateId() {
  let randomId = Math.random().toString(36).substring(5);

  return randomId;
}

//-------URL MANAGEMENT-------\\
app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls', (req, res) => {
  let templateVars = {
    urls: urlDatabase
  };

  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  let templateVars = {
    urls: urlDatabase
  };

  res.render('urls_new', templateVars);
});

// Create new short URL
app.post('/urls', (req, res) => {
  let shortUrl = generateId();
  let longUrl = req.body.longUrl;

  urlDatabase[shortUrl] = longUrl;
  res.redirect('/urls');
});

// Updates new short URL
app.post('/urls/:id', (req, res) => {
  let shortUrl = req.params.id;
  let longUrl = req.body.longUrl;

  urlDatabase[shortUrl] = longUrl;
  res.redirect('/urls');
});

// Delete a short URL
app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

// Show short URL
app.get('/urls/:id', (req, res) => {
  let templateVars = {
    shortUrl: req.params.id,
    longUrl: urlDatabase[req.params.id]
  };

  res.render('urls_show', templateVars);
});

// Redirect to short URL
app.get('/u/:shortUrl', (req, res) => {
  res.redirect(longUrl);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});