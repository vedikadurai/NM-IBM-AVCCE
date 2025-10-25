const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuthLog = require('../models/AuthLog');
const RefreshToken = require('../models/RefreshToken');
const { sendMail } = require('../utils/mailer');

const ACCESS_EXPIRES = process.env.TOKEN_EXPIRES || '15m';
const REFRESH_EXPIRES = process.env.REFRESH_EXPIRES || '7d';

function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}
function signRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
}
function signEmailToken(payload) {
  return jwt.sign(payload, process.env.JWT_EMAIL_SECRET, { expiresIn: '1d' });
}

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ msg: 'Name, email and password required' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });
    const emailToken = signEmailToken({ id: user._id, email: user.email });
    const url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${emailToken}`;
    await sendMail(user.email, 'Verify your email', `<p>Click to verify: <a href="${url}">${url}</a></p>`).catch(()=>{});
    await AuthLog.create({ email: user.email, action: 'verify_email', ip: req.ip, userAgent: req.get('User-Agent') });
    res.status(201).json({ msg: 'Signup successful. Check email to verify account' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    await AuthLog.create({ email, action: user ? 'login_attempt' : 'login_failed', ip: req.ip });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password || '');
    if (!match) {
      await AuthLog.create({ email, action: 'login_failed', ip: req.ip });
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    if (!user.isVerified) return res.status(403).json({ msg: 'Email not verified' });
    const accessToken = signAccessToken({ id: user._id, role: user.role });
    const refreshToken = signRefreshToken({ id: user._id, role: user.role });
    await RefreshToken.create({ token: refreshToken, userId: user._id, expiresAt: new Date(Date.now() + 7*24*3600*1000) });
    await AuthLog.create({ email, action: 'login_success', ip: req.ip });
    res.json({ msg: 'Login successful', accessToken, refreshToken, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -twoFA.secret');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    if (name) user.name = name;
    if (email && email !== user.email) { user.email = email; user.isVerified = false; }
    if (password) user.password = await bcrypt.hash(password,10);
    await user.save();
    res.json({ msg: 'Profile updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ msg: 'If that email exists, a reset link has been sent' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_EMAIL_SECRET, { expiresIn: '15m' });
    const url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    await sendMail(user.email, 'Password Reset', `<p>Reset: <a href="${url}">${url}</a></p>`).catch(()=>{});
    await AuthLog.create({ email, action: 'password_reset_request', ip: req.ip });
    res.json({ msg: 'If that email exists, a reset link has been sent' });
  } catch (err) {
    console.error(err); res.status(500).json({ msg: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_EMAIL_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    user.password = await bcrypt.hash(password,10);
    await user.save();
    await AuthLog.create({ email: user.email, action: 'password_reset', ip: req.ip });
    res.json({ msg: 'Password reset successful' });
  } catch (err) {
    console.error(err); res.status(400).json({ msg: 'Invalid or expired token' });
  }
};
