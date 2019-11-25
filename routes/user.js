const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../model/User');
const randomString = require('randomstring');
const nodemailer = require('nodemailer');
const { forwardAuthenticated } = require('../config/auth');
const Item = require('../model/Item');
// Login Page
router.get('/login', forwardAuthenticated, (req, res) => res.render('login'));

// Register Page
router.get('/register', forwardAuthenticated, (req, res) => {
  res.render('register');
});

// Register
router.post('/register', (req, res) => {
  const { name, email, password, password2 } = req.body;
  let errors = [];

  if (!name || !email || !password || !password2) {
    errors.push({ msg: 'Please enter all fields' });
  }

  if (password != password2) {
    errors.push({ msg: 'Passwords do not match' });
  }

  if (password < 6) {
    errors.push({ msg: 'Password must be at least 6 characters' });
  }

  if (errors.length > 0) {
    res.render('register', {
      errors,
      name,
      email,
      password,
      password2
    });
  } else {
    User.findOne({ email: email }).then(user => {
      if (user) {
        errors.push({ msg: 'Email already exists' });
        res.render('register', {
          errors,
          name,
          email,
          password,
          password2
        });
      } else {
        const verificationToken = randomString.generate({
          length: 6,
          charset: 'ABCDEFGabcdefg0123456789'
        });
        const resetToken = randomString.generate({
          length: 6,
          charset: 'ABCDEFGabcdefg0123456789'
        });
        const newUser = new User({
          name,
          email,
          password,
          verificationToken,
          resetToken
        });

        bcrypt.genSalt(6, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser
              .save()
              .then(user => {
                // Send the email
                var transporter = nodemailer.createTransport({
                  service: 'gmail',
                  auth: {
                    user: 'nonreplay.lockedinside@gmail.com',
                    pass: 'Frank01!'
                  }
                });
                var mailOptions = {
                  from: 'no-reply@lockedinside.com',
                  to: user.email,
                  subject: 'Email Verification Token',
                  text: 'Your token: ' + user.verificationToken + '.\n'
                };
                transporter.sendMail(mailOptions, function(err) {
                  if (err) {
                    console.log(err);
                  }
                });
                req.flash(
                  'success_msg',
                  'Please verify your account before process to login'
                );
                res.redirect('/user/verify');
              })
              .catch(err => console.log(err));
          });
        });
      }
    });
  }
});

//verify
router.get('/verify', (req, res) => {
  res.render('verify');
});

router.post('/verify', (req, res) => {
  let errors = [];
  const { token } = req.body;
  if (!token) {
    errors.push({ msg: 'Please enter your token first' });
  }
  if (errors.length > 0) {
    res.render('verify', {
      errors,
      token
    });
  } else {
    User.findOne({ verificationToken: token }, (err, user) => {
      if (!user) {
        errors.push({ msg: 'Incorrect token' });
        res.render('verify', {
          errors,
          token
        });
      } else {
        user.isVerified = true;
        user.verificationToken = ' ';
        user.save();
        req.flash('success_msg', 'Verification passed, You may now login');
        res.redirect('/user/login');
      }
    });
  }
});

// Login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard/1',
    failureRedirect: '/user/login',
    failureFlash: true
  })(req, res, next);
});

// Logout
router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/user/login');
});

router.get('/reset', (req, res) => {
  res.render('resetemail');
});

router.get('/reset/submit', (req, res) => {
  res.render('resetpassword');
});

router.post('/reset/submit', (req, res) => {
  const { email, token, password, cpassword } = req.body;
  let errors = [];
  if (!token || !password || !cpassword) {
    errors.push({ msg: 'Please enter all fields' });
    res.render('resetpassword', {
      errors,
      email,
      token,
      password,
      cpassword
    });
  } else {
    User.findOne({ email: email }, (err, user) => {
      if (err) throw err;
      if (token != user.resetToken) {
        console.log(token);
        console.log(user.resetToken);
        errors.push({ msg: 'Please enter a correct token' });
        res.render('resetpassword', {
          errors,
          email,
          token,
          password,
          cpassword
        });
      } else {
        const resetToken = randomString.generate({
          length: 6,
          charset: 'ABCDEFGabcdefg0123456789'
        });
        user.resetToken = resetToken;
        bcrypt.genSalt(6, (err, salt) => {
          bcrypt.hash(password, salt, (err, hash) => {
            if (err) throw err;
            user.password = hash;
            user.save();
            req.flash(
              'success_msg',
              'Your password has been succussfully changed, you may login now'
            );
            res.redirect('/user/login');
          });
        });
      }
    });
  }
});

router.post('/reset/getcode', (req, res) => {
  const { email } = req.body;
  let errors = [];
  if (!email) {
    errors.push({ msg: 'Please enter your email' });
    res.render('resetemail', {
      errors,
      email
    });
  } else {
    User.findOne({ email: email }).then(user => {
      if (!user) {
        errors.push({ msg: 'Email not found' });
        res.render('resetemail', {
          errors,
          email
        });
      } else {
        if (user.isVerified == true) {
          // Send the email
          var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'nonreplay.lockedinside@gmail.com',
              pass: 'Frank01!'
            }
          });
          var mailOptions = {
            from: 'no-reply@lockedinside.com',
            to: user.email,
            subject: 'Password Reset Token',
            text: 'Your token: ' + user.resetToken + '.\n'
          };
          transporter.sendMail(mailOptions, function(err) {
            if (err) {
              console.log(err);
            }
          });
          res.render('resetpassword', {
            email
          });
        } else {
          req.flash('error_msg', 'please verify you account first');
          res.redirect('/user/verify');
        }
      }
    });
  }
});

// user's profile page
router.get('/profile', (req, res) => {
  const { date, name, email } = req.user;
  let artifacts;
  Item.countDocuments({ userId: req.user.id }, (err, count) => {
    if (err) {
      console.log(err);
    } else {
      artifacts = count;
      res.render('profilepage', { date, name, email, artifacts });
    }
  });
  // res.render('profilepage', {user: req.user, name: req.user.name, email: req.user.email});
});

router.post('/profile', async (req, res) => {
  const { oldpassword, newpassword, confirmpassword } = req.body;
  const { date, name, email, password } = req.user;
  let errors = [];
  let artifacts;
  try {
    Item.countDocuments({ userId: req.user.id }, (err, count) => {
      if (err) {
        console.log(err);
      } else {
        artifacts = count;
      }
    });
  } catch (err) {
    console.log(err);
  }

  if (!oldpassword || !newpassword || !confirmpassword) {
    errors.push({ msg: 'Please enter all fields' });
    res.render('profilepage', {
      errors,
      date,
      name,
      email,
      artifacts
    });
  }
  if (confirmpassword !== newpassword) {
    errors.push({ msg: 'Please reconfirm your password' });
    res.render('profilepage', {
      errors,
      date,
      name,
      email,
      artifacts
    });
  }

  // check whether the current user is the account owner
  bcrypt.compare(oldpassword, password, (err, res) => {
    if (err) {
      errors.push({ msg: 'Old password incorrect' });
      res.render('profilepage', {
        errors,
        name,
        date,
        email,
        artifacts
      });
    } else {
      bcrypt.genSalt(6, (err, salt) => {
        bcrypt.hash(newpassword, salt, (err, hash) => {
          if (err) {
            throw err;
          }
          const filter = { email: email };
          // Update the user password
          try {
            User.findOne(filter, (err, user) => {
              if (err) {
                throw err;
              }
              user.password = hash;
              user.save();
              req.flash(
                'success_msg',
                'Your password has been successfully changed'
              );
            });
          } catch (err) {
            console.log(err);
          }
        });
      });
    }
  });

  res.render('profilepage', {
    date,
    name,
    email,
    artifacts
  });
});

module.exports = router;
