const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/adminController');
const { verifyAccessToken, requireRole } = require('../middlewares/auth');

router.get('/users', verifyAccessToken, requireRole('admin'), adminCtrl.getAllUsers);
router.put('/role', verifyAccessToken, requireRole('admin'), adminCtrl.updateRole);
router.get('/logs', verifyAccessToken, requireRole('admin'), adminCtrl.getLogs);

module.exports = router;
