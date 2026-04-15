require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dns= require('dns');
const connectDB = require('./src/config/db');
const aiRoutes = require('./src/routes/aiRoutes');
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
    service: 'ai-service',
    message: 'AI service is running'
  });
});

app.use('/api/ai', aiRoutes);

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 4006;

const startServer = async () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables');
  }

  await connectDB();

  app.listen(PORT, () => {
    console.log(`ai-service running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start ai-service:', error.message);
  process.exit(1);
});
