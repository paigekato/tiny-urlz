require('dotenv').config();
const generateRandomId = require('./helpers/generateRandomId');
const createNewUser = require('./helpers/user');
const path = require('path')
const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const MongoClient = require('mongodb').MongoClient;
const bcrypt = require('bcrypt');
const app = express();
const PORT = process.env.PORT || 8080;
const MONGO_URL = `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@ds211635.mlab.com:11635/${process.env.DB_NAME}`;
const USERS_COLLECTION = 'users';
const URLS_COLLECTION = 'urls';
var db;

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, '../public')));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: [process.env.COOKIE_SESSION_KEY]
}))

//-------Connect to mongoDb-------\\
function saveToCollection(collection, item, res) {
  db.collection(collection).save(item, (err, result) => {
    if (err) {
      return console.log(err);
    };

    res.redirect('/urls');
  });
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

// Show user's urls
app.get('/urls', (req, res) => {
  if (req.session.user_id) {
    db.collection(URLS_COLLECTION).find( { 'user_id': req.session.user_id } ).toArray(function(err, usersUrls) {
      let templateVars = {
        urls: usersUrls,
        user: req.session
      };

      res.render('urls_index', templateVars);
    });
  } else {
    res.redirect('/');
  }
});

app.get('/urls/new', (req, res) => {
  if (req.session.user_id) {
    let templateVars = {
      user: req.session
    };

    res.render('urls_new', templateVars);
  } else {
    res.redirect('/');
  };
});

// Create new short URL
app.post('/urls', (req, res) => {
  let shortUrl = generateRandomId(),
      longUrl = req.body.longUrl,
      url = {
    user_id: req.session.user_id,
    long_url: longUrl,
    short_url: shortUrl
  }

  saveToCollection(URLS_COLLECTION, url, res);
});

// Updates new short URL
app.post('/urls/:id', (req, res) => {
  db.collection(URLS_COLLECTION).findOneAndUpdate(
    { 'short_url': req.params.id },
    { $set: {'long_url': req.body.longUrl} }
  );
  res.redirect('/urls');
});

// Delete a short URL
app.post('/urls/:id/delete', (req, res) => {
  db.collection(URLS_COLLECTION).remove({ 'short_url': req.params.id });
  res.redirect('/urls');
});

// Show short URL
app.get('/urls/:id', (req, res) => {
  db.collection(URLS_COLLECTION).find({ 'short_url': req.params.id }).toArray(function(err, result) {
    let templateVars = {
      user: req.session,
      shortUrl: req.params.id,
      url: result[0]
    };
      
    res.render('urls_show', templateVars);
  });
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
  let username = req.body.username,
      email = req.body.email,
      password = req.body.password;

  // validate form
  if (!username || !email || !password) {
    res.status(400).send('Please fill out entire form');
  } else {
    db.collection(USERS_COLLECTION).find( { 'email': email } ).toArray(function(err, result) {
      // Check if email exists in db
      if (!result[0]) {
        let user = createNewUser(username, email, password);
        
        req.session = {
          user_id: user.user_id,
          email: user.email,
          username: user.username
        }
        
        saveToCollection(USERS_COLLECTION, user, res);
      } else {
        res.status(400).send('Sorry, this user already exists!');
      }
    });
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
  let email = req.body.email,
      password = req.body.password,
      user;

  if (!email || !password) {
    res.send('Please fill out email and password');
  } else {
    db.collection(USERS_COLLECTION).find( { 'email': email } ).toArray(function(err, result) {
      if (user = result[0]) {
        if (bcrypt.compareSync(req.body.password, user.password)) {
          req.session.user_id = user.user_id;
          res.redirect('/urls');
        } else {
          res.status(400).send('Sorry, that\'s the wrong password');
        }
      } else {
        res.status(400).send('This account does not exist.');
      }
    });
  }
});

// Log Out
app.get('/logout', (req, res) => {
  req.session = null;
  res.redirect('/');
});

//-------Connect to mongoDb-------\\
MongoClient.connect(MONGO_URL, { useNewUrlParser: true }, (err, client) => {
  if (err) {
    return console.log(err);
  };

  db = client.db('tiny-urls');
  app.listen(PORT, () => {
    console.log(`Listening on ${PORT}`);
  })
});