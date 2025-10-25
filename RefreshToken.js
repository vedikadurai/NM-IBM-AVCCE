const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  token: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true },
  revoked: { type: Boolean, default: false }
}, { timestamps: true });
module.exports = mongoose.model('RefreshToken', schema);
