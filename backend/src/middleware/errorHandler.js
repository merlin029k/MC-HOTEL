// Centralized error handler. Route handlers should call next(err) on unexpected failures.
function errorHandler(err, req, res, next) {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? 'Internal server error.' : err.message,
  });
}

module.exports = { errorHandler };
