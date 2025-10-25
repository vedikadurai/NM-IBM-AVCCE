const mongoose = require('mongoose');
const logSchema = new mongoose.Schema({
  email: String,
  action: { type: String, enum: ['login_success','login_failed','logout','password_reset','password_reset_request','verify_email','login_attempt'], required: true },
  ip: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now }
});
module.exports = mongoose.model('AuthLog', logSchema);
