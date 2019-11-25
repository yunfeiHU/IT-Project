const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary');
const cloudinaryStorage = require('multer-storage-cloudinary');
const multer = require('multer');
const Item = require('../model/Item');
const { ensureAuthenticated } = require('../config/auth');
const methodOverride = require('method-override');
require('dotenv').config();
const { CLOUD_NAME, API_KEY, API_SECRET } = process.env;

//middleware
router.use(methodOverride('_method'));

router.get('/file/upload', ensureAuthenticated, (req, res) => {
  res.render('upload');
});

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET
});

const storage = cloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    allowedFormats: ['jpg', 'png', 'mp4', 'mp3'],
    resource_type: 'auto',
    folder: 'medias'
  }
});

const parser = multer({ storage: storage });

// create item
router.post(
  '/file/upload',
  ensureAuthenticated,
  parser.single('file'),
  (req, res) => {
    let { name, description, checkbox } = req.body;
    let errors = [];
    let public;
    let file = req.file;
    let userId = req.user.id;
    if (checkbox == 'on') {
      public = true;
    } else {
      public = false;
    }
    if (!file || !name || !description) {
      errors.push({ msg: 'Please enter all fields' });
    }
    if (errors.length > 0) {
      res.render('upload', {
        errors,
        file,
        name,
        description
      });
    } else {
      let imageURL = req.file.url;
      let imageId = req.file.public_id;
      let mediaType = req.file.format;
      let resourceType = req.file.resource_type;
      const item = new Item({
        name,
        description,
        userId,
        imageURL,
        imageId,
        mediaType,
        resourceType,
        public
      });
      item.save();
      res.redirect('/dashboard/1');
    }
  }
);

// delete item
router.delete('/file/:id', ensureAuthenticated, (req, res) => {
  //delete media from the cloud
  Item.findOne({ _id: req.params.id }, (err, item) => {
    //delete video or audio
    if (item.mediaType == 'mp4' || item.mediaType == 'mp3') {
      cloudinary.uploader.destroy(
        item.imageId,
        err => {
          if (err) {
            console.log(err);
          }
        },
        { resource_type: 'video' }
      );
    } else {
      //delete image
      cloudinary.uploader.destroy(item.imageId, err => {
        if (err) {
          console.log(err);
        }
      });
    }
  });
  //delete the media from mongoDB
  Item.findByIdAndDelete(
    req.params.id,
    {
      useFindAndModify: false
    },
    err => {
      if (err) {
        console.log(err);
      } else {
        res.redirect('/dashboard/1');
      }
    }
  );
});

//update the item
router.post('/file', ensureAuthenticated, (req, res) => {
  const { itemId, name, description } = req.body;
  Item.findById(itemId, (err, item) => {
    if (err) {
      console.log(err);
    } else {
      const { userId, imageURL, imageId, mediaType, resourceType } = item;
      const update = {
        name,
        description,
        userId,
        imageURL,
        imageId,
        mediaType,
        resourceType
      };
      Item.findByIdAndUpdate(
        itemId,
        update,
        {
          useFindAndModify: false
        },
        err => {}
      );
      res.redirect('/dashboard/1');
    }
  });
});

router.get('/dashboard/search', (req, res) => {
  res.render('dashboard');
});

module.exports = router;
