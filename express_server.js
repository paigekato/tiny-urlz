require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const urlDatabase = {};
const userDatabase = {};

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['purple']
}))

//-------HELPERS-------\\
function generateId() {
  let randomId = Math.random().toString(36).substring(5);

  return randomId;
}

function checkExistingUser(email) {
  for (let user in userDatabase) {
    if (userDatabase[user].email === email) {
      return user;
    }
    
    return false;
  }
}

function getUsersUrls(id) {
  let urls = [];

  for (let url in urlDatabase) {
    if (urlDatabase[url].id === id) {
      urls.push(urlDatabase[url]);
    }
  }
  
  return urls;
}

//-------URL MANAGEMENT-------\\
app.get('/', (req, res) => {
  let templateVars = {
    user: req.session
  };

  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.render('index', templateVars);
  }
});

// User's urls
app.get('/urls', (req, res) => {
  if (req.session.user_id) {
    let usersUrls = getUsersUrls(req.session.user_id);
    let templateVars = {
      urls: usersUrls,
      user: req.session
    };

    res.render('urls_index', templateVars);
  } else {
    res.redirect('/');
  }
});

app.get('/urls/new', (req, res) => {
  if (req.session.user_id) {
    let templateVars = {
      urls: urlDatabase,
      user: req.session
    };

    res.render('urls_new', templateVars);
  } else {
    res.redirect('/');
  };
});

// Create new short URL
app.post('/urls', (req, res) => {
  let shortUrl = generateId();
  let longUrl = req.body.longUrl;

  urlDatabase[shortUrl] = {
    id: req.session.user_id,
    shortUrl: shortUrl,
    longUrl: longUrl
  };

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
    user: req.session,
    shortUrl: req.params.id,
    longUrl: urlDatabase[req.params.id]
  };
    
  res.render('urls_show', templateVars);
});

// Redirect to short URL
app.get('/u/:shortUrl', (res) => {
  res.redirect(longUrl);
});

//-------USER AUTHENTICATION-------\\

// Show registration form
app.get('/register', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    let templateVars = {
      user: req.session
    };

    res.render('register', templateVars);
  }
});

// Register User
app.post('/register', (req, res) => {
  let userId = generateId();
  let username = req.body.username;
  let email = req.body.email;
  let password = req.body.password;
  let encryptedPassword = bcrypt.hashSync(password, 10);
  let existingUser = checkExistingUser(email);

  if (!username || !email || !password) {
    res.send('Please fill out entire form');
  } else if(existingUser) {
    res.status(400).send('Sorry, this user already exists!');
  } else {
    userDatabase[userId] = {
      id: userId,
      username: username,
      email: email,
      password: encryptedPassword
    };
    
    req.session = {
      user_id: userDatabase[userId].id,
      email: email,
      username: username
    }
    res.redirect('/urls');
  }
});

// Show login form
app.get('/login', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    let templateVars = {
      user: req.session
    };

    res.render('login', templateVars);
  }
});

// Log In
app.post('/login', (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let existingUser = checkExistingUser(email);

  if (!email || !password) {
    res.send('Please fill out email and password');
  } else if (!existingUser) {
    res.status(400).send('User does not exist');
  } else if (existingUser) {
    let user = userDatabase[existingUser];

    if (bcrypt.compareSync(password, user.password)) {
      req.session.user_id = user.id;
      res.redirect('/urls');
    } else {
      res.status(400).send('Sorry, that\'s the wrong password');
    }
  }
});

// Log Out
app.get('/logout', (req, res) => {
  req.session = null;
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}!`);
});