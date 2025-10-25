const User = require('../models/User');
const AuthLog = require('../models/AuthLog');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password -twoFA.secret');
    res.json(users);
  } catch (err) { console.error(err); res.status(500).json({ msg: 'Server error' }); }
};

exports.updateRole = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const allowed = ['user','moderator','admin','superadmin'];
    if (!allowed.includes(role)) return res.status(400).json({ msg: 'Invalid role' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    user.role = role; await user.save();
    res.json({ msg: 'Role updated successfully' });
  } catch (err) { console.error(err); res.status(500).json({ msg: 'Server error' }); }
};

exports.getLogs = async (req, res) => {
  try {
    const logs = await AuthLog.find().sort({ timestamp: -1 }).limit(200);
    res.json(logs);
  } catch (err) { console.error(err); res.status(500).json({ msg: 'Server error' }); }
};
