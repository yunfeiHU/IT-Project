const express = require('express');
const connectDB = require('./config/db');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const moment = require('moment');
const ejsLayouts = require('express-ejs-layouts');
require('dotenv').config();
const { SESSION_SECRET } = process.env;

// Passport Config
require('./config/passport')(passport);

const app = express();
app.locals.moment = require('moment');

// DB Connect
connectDB();

app.use(ejsLayouts);
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/assets'));
// Express body parser
app.use(express.urlencoded({ extended: true }));

// Express session
app.use(
  session({
    secret: SESSION_SECRET,
    resave: true,
    saveUninitialized: true
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// routes
app.use('/', require('./routes/index.js'));
app.use('/', require('./routes/item.js'));
app.use('/user', require('./routes/user.js'));
app.use('/auth', require('./routes/oauth.js'));

//define port
const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`server start at ${PORT}`));
