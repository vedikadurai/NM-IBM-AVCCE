const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authCtrl = require('../controllers/authController');
const { verifyAccessToken } = require('../middlewares/auth');

const loginLimiter = rateLimit({ windowMs: 10*60*1000, max: 6, message: 'Too many login attempts, try later.' });

router.post('/signup', authCtrl.signup);
router.post('/login', loginLimiter, authCtrl.login);
router.post('/forgot-password', authCtrl.forgotPassword);
router.post('/reset-password/:token', authCtrl.resetPassword);

router.get('/profile', verifyAccessToken, authCtrl.getProfile);
router.put('/profile', verifyAccessToken, authCtrl.updateProfile);

module.exports = router;
