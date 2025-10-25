require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

const app = express();
connectDB();

app.use(helmet());
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));
app.use(morgan('dev'));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300
});
app.use(globalLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => res.json({ msg: 'User Auth API running' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
