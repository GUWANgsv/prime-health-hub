require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dns= require('dns');
const connectDB = require('./src/config/db');
const notificationRoutes = require('./src/routes/notificationRoutes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
dns.setServers(['8.8.8.8', '8.8.4.4'])
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'notification-service',
    message: 'Notification service is running'
  });
});

app.use('/api/notifications', notificationRoutes);

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 4005;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`notification-service running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start notification-service:', error.message);
  process.exit(1);
});
