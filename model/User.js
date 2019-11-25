const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  password: String,
  email: String,
  isVerified: {
    type: Boolean,
    default: false
  },
  oauthId: String,
  verificationToken: String,
  resetToken: String,
  date: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
