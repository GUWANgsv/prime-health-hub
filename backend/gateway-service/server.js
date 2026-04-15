require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dns= require('dns');
const connectDB = require('./src/config/db');
const gatewayRoutes = require('./src/routes/gatewayRoutes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
dns.setServers(['8.8.8.8', '8.8.4.4'])
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'gateway-service',
    message: 'API Gateway is running'
  });
});

app.use('/api', gatewayRoutes);

// Keep JSON parser after proxy routes to avoid consuming proxied request bodies.
app.use(express.json());

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 4000;

const startServer = async () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }

  await connectDB();

  app.listen(PORT, () => {
    console.log(`gateway-service running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start gateway-service:', error.message);
  process.exit(1);
});
