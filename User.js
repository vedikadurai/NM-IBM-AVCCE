const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String },
  role: { type: String, enum: ['superadmin','admin','moderator','user'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  twoFA: {
    enabled: { type: Boolean, default: false },
    secret: { type: String }
  },
  failedLoginAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
