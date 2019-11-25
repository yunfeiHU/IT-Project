const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  imageURL: {
    type: String,
    required: true
  },
  imageId: {
    type: String,
    required: true
  },
  mediaType: {
    type: String,
    required: true
  },
  resourceType: {
    type: String,
    required: true
  },
  public: {
    type: Boolean,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const Item = mongoose.model('Item', ItemSchema);

module.exports = Item;
