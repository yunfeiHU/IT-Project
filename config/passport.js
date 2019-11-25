const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../model/User');
const config = require('config');
const FacebookStrategy = require('passport-facebook');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const TwitterStrategy = require('passport-twitter');
require('dotenv').config();

const {
  GOOGLE_API_KEY,
  GOOGLE_API_SECRET,
  FACEBOOK_API_KEY,
  FACEBOOK_API_SECRET,
  TWITTER_API_KEY,
  TWITTER_API_SECRET
} = process.env;

module.exports = passport => {
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
      // Match user
      User.findOne({
        email: email
      }).then(user => {
        if (!user) {
          return done(null, false, { message: 'That email is not registered' });
        }

        // Match password
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) throw err;
          if (isMatch) {
            if (user.isVerified) {
              return done(null, user);
            } else {
              return done(null, false, {
                message: 'Account has not been verified'
              });
            }
          } else {
            return done(null, false, { message: 'Password incorrect' });
          }
        });
      });
    })
  );

  passport.use(
    new GoogleStrategy(
      {
        callbackURL: 'http://localhost:5000/auth/google/redirect',
        clientID: GOOGLE_API_KEY,
        clientSecret: GOOGLE_API_SECRET
      },
      (accessToken, refreshToken, profile, done) => {
        User.findOne({ oauthId: profile.id }).then(currentUser => {
          if (currentUser) {
            done(null, currentUser);
          } else {
            new User({
              name: profile.displayName,
              oauthId: profile.id
            })
              .save()
              .then(newUser => {
                done(null, newUser);
              });
          }
        });
      }
    )
  );

  passport.use(
    new FacebookStrategy(
      {
        callbackURL: 'http://localhost:5000/auth/facebook/redirect',
        clientID: FACEBOOK_API_KEY,
        clientSecret: FACEBOOK_API_SECRET
      },
      (accessToken, refreshToken, profile, done) => {
        User.findOne({ oauthId: profile.id }).then(currentUser => {
          if (currentUser) {
            done(null, currentUser);
          } else {
            new User({
              name: profile.displayName,
              oauthId: profile.id
            })
              .save()
              .then(newUser => {
                done(null, newUser);
              });
          }
        });
      }
    )
  );

  passport.use(
    new TwitterStrategy(
      {
        callbackURL: 'http://localhost:5000/auth/twitter/redirect',
        consumerKey: TWITTER_API_KEY,
        consumerSecret: TWITTER_API_SECRET
      },
      (token, tokenSecret, profile, done) => {
        User.findOne({ oauthId: profile.id }).then(currentUser => {
          if (currentUser) {
            done(null, currentUser);
          } else {
            new User({
              name: profile.displayName,
              oauthId: profile.id
            })
              .save()
              .then(newUser => {
                done(null, newUser);
              });
          }
        });
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
};
