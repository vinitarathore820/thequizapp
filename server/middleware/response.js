// middleware/response.js
const responseHandler = (req, res, next) => {
  res.success = (data, message = 'Success', statusCode = 200) => {
    res.status(statusCode).json({
      success: true,
      message,
      data
    });
  };

  res.error = (message, statusCode = 400, data = null) => {
    res.status(statusCode).json({
      success: false,
      message,
      data
    });
  };

  next();
};

module.exports = responseHandler;