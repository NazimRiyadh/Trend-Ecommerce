import { StatusCodes } from 'http-status-codes';

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;
  
  if (!statusCode) {
    statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  }

  // Use a generic message for 500s in production
  if (statusCode === StatusCodes.INTERNAL_SERVER_ERROR && process.env.NODE_ENV === 'production') {
    message = 'Internal Server Error';
  }

  const response = {
    success: false,
    statusCode,
    message,
    ...(err.errors && err.errors.length > 0 && { errors: err.errors }),
  };

  res.status(statusCode).json(response);
};

export default errorHandler;
