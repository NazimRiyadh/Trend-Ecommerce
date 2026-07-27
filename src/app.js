const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { StatusCodes } = require('http-status-codes');

const errorHandler = require('./middleware/errorHandler');
const ApiError = require('./utils/ApiError');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve static files for uploads
app.use('/uploads', express.static('uploads'));

// Routes (to be added)
app.get('/health', (req, res) => {
  res.status(StatusCodes.OK).json({ success: true, message: 'Server is running' });
});

// 404 handler
app.use((req, res, next) => {
  next(new ApiError(StatusCodes.NOT_FOUND, 'Not found'));
});

// Global error handler
app.use(errorHandler);

module.exports = app;
