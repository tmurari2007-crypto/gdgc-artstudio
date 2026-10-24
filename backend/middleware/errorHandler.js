import mongoose from 'mongoose';

/**
 * Centralized error handler middleware.
 * Ensures consistent error shapes and prevents leaking stack traces or internal secrets to clients.
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found with id: ${err.value}`;
  }

  // Handle Mongoose Duplicate Key error (11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    if (field === 'bookingDate') {
      message = 'This date has already been booked. Please choose another date.';
    } else if (field === 'email') {
      message = 'An account with this email address already exists.';
    } else {
      message = `Duplicate field value entered: ${field}.`;
    }
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired. Please log in again.';
  }

  console.error(`[Error] ${statusCode} - ${message}`);
  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

/**
 * 404 Not Found Handler for unknown API routes
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
};
