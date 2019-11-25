const express = require('express');
const router = express.Router();
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
const Item = require('../model/Item');

router.get('/', forwardAuthenticated, (req, res) => {
  res.render('index');
});

router.get('/home/:page', async (req, res, next) => {
  const perPage = 9;
  const page = req.params.page || 1;
  try {
    const videos = await Item.find({
      public: true,
      mediaType: 'mp4'
    }).sort({
      date: -1
    });
    const audios = await Item.find({
      public: true,
      mediaType: 'mp3'
    }).sort({
      date: -1
    });
    Item.find({ public: true, resourceType: 'image' })
      .sort({ date: -1 })
      .skip(perPage * page - perPage)
      .limit(perPage)
      .exec((err, images) => {
        Item.countDocuments().exec(function(err, count) {
          if (err) return next(err);
          res.render('home', {
            images: images,
            videos: videos,
            audios: audios,
            current: page,
            pages: Math.ceil(count / perPage)
          });
        });
      });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/dashboard/:page', async (req, res, next) => {
  const perPage = 9;
  const page = req.params.page || 1;
  try {
    const videos = await Item.find({
      userId: req.user.id,
      mediaType: 'mp4'
    }).sort({
      date: -1
    });
    const audios = await Item.find({
      userId: req.user.id,
      mediaType: 'mp3'
    }).sort({
      date: -1
    });
    Item.find({ userId: req.user.id, resourceType: 'image' })
      .sort({ date: -1 })
      .skip(perPage * page - perPage)
      .limit(perPage)
      .exec((err, images) => {
        Item.countDocuments().exec(function(err, count) {
          if (err) return next(err);
          res.render('dashboard', {
            images: images,
            videos: videos,
            audios: audios,
            current: page,
            name: req.user.name,
            pages: Math.ceil(count / perPage)
          });
        });
      });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
