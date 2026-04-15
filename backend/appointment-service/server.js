require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dns= require('dns');
const connectDB = require('./src/config/db');
const appointmentRoutes = require('./src/routes/appointmentRoutes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
dns.setServers(['8.8.8.8', '8.8.4.4'])
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    }
  })
);
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'appointment-service',
    message: 'Appointment service is running'
  });
});

app.use('/api/appointments', appointmentRoutes);

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 4004;

const startServer = async () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }

  await connectDB();

  app.listen(PORT, () => {
    console.log(`appointment-service running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start appointment-service:', error.message);
  process.exit(1);
});
