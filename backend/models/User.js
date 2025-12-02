const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  status: {
    type: String,
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);