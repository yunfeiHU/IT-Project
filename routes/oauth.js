const router = require('express').Router();
const passport = require('passport');

router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile']
  })
);

router.get('/google/redirect', passport.authenticate('google'), (req, res) => {
  res.redirect('/dashboard/1');
});

router.get('/facebook', passport.authenticate('facebook'));

router.get(
  '/facebook/redirect',
  passport.authenticate('facebook'),
  (req, res) => {
    res.redirect('/dashboard/1');
  }
);

router.get('/twitter', passport.authenticate('twitter'));

router.get(
  '/twitter/redirect',
  passport.authenticate('twitter'),
  (req, res) => {
    res.redirect('/dashboard/1');
  }
);

module.exports = router;
