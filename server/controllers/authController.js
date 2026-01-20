// controllers/authController.js
const crypto = require('crypto');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { sendEmail, emailTemplates } = require('../utils/email');
const logger = require('../utils/logger');

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Input validation
    if (!name || !email || !password) {
      return next(new ErrorResponse('Please provide all required fields', 400));
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return next(new ErrorResponse('Please provide a valid email address', 400));
    }

    // Password strength validation
    if (password.length < 6) {
      return next(new ErrorResponse('Password must be at least 6 characters long', 400));
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorResponse('User already exists with this email', 409)); // 409 Conflict
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      isEmailVerified: true // Auto-verify email for now
    });

    // Generate JWT token
    const token = user.getSignedJwtToken();

    // Omit sensitive data from response
    const userData = user.toObject();
    delete userData.password;
    delete userData.resetPasswordToken;
    delete userData.resetPasswordExpire;

    // Log successful registration (without sensitive data)
    if (logger) {
      logger.info(`New user registered: ${user._id} - ${user.email}`);
    }

    // Send success response with user data and token
    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      },
      token
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return next(new ErrorResponse(messages.join(', '), 400));
    }
    next(error);
  }
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return next(new ErrorResponse('Please provide an email and password', 400));
    }

    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return next(new ErrorResponse('Please provide a valid email address', 400));
    }

    // Check for user
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return next(new ErrorResponse('Invalid email or password', 401));
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return next(new ErrorResponse('Invalid email or password', 401));
    }

    // Send success response with user data and token
    const token = user.getSignedJwtToken();
    
    res.status(200).json({
      success: true,
      message: 'Login successful!',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      },
      token
    });
  } catch (error) {
    next(new ErrorResponse('Login failed. Please try again later.', 500));
  }
});

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-__v -createdAt -updatedAt');
    
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(new ErrorResponse('Failed to fetch user data', 500));
  }
});

// @desc    Forgot password - Send OTP
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  // Validate email is provided
  if (!email) {
    return next(new ErrorResponse('Please provide an email address', 400));
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return next(new ErrorResponse('Please provide a valid email address', 400));
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  // For security, don't reveal if the email exists or not
  if (!user) {
    // Log the attempt for security monitoring
    console.log(`Password reset attempt for non-existent email: ${email}`);
    return res.status(200).json({
      success: true,
      message: 'If your email is registered, you will receive an OTP'
    });
  }

  // Check if there's a recent OTP request (rate limiting)
  if (user.resetPasswordExpire && user.resetPasswordExpire > Date.now()) {
    const timeLeft = Math.ceil((user.resetPasswordExpire - Date.now()) / 1000 / 60);
    return next(new ErrorResponse(
      `Please wait ${timeLeft} minutes before requesting a new OTP`,
      429 // Too Many Requests
    ));
  }

  try {
    // Generate 6-digit OTP
    const otp = user.generateResetOtp();
    await user.save({ validateBeforeSave: false });

    // Send OTP to user's email
    await sendEmail({
      email: user.email,
      subject: 'Password Reset OTP',
      message: `Your OTP for password reset is: ${otp}. This OTP is valid for 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset OTP</h2>
          <p>Hello ${user.name},</p>
          <p>Your OTP for password reset is:</p>
          <h1 style="font-size: 36px; letter-spacing: 5px; color: #4CAF50;">${otp}</h1>
          <p>This OTP is valid for 10 minutes.</p>
          <p>If you did not request this, please ignore this email or contact support if you have concerns.</p>
          <p style="font-size: 12px; color: #666; margin-top: 20px;">
            For security reasons, this OTP will expire in 10 minutes and can only be used once.
          </p>
        </div>
      `
    });

    // Log successful OTP generation
    console.log(`OTP sent to ${user.email} (User ID: ${user._id})`);

    res.status(200).json({ 
      success: true, 
      message: 'If your email is registered, you will receive an OTP'
    });
  } catch (err) {
    console.error('Error in forgot password:', {
      email: user.email,
      error: err.message,
      stack: err.stack
    });
    
    // Clear the reset token in case of error
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Unable to process your request. Please try again later.', 500));
  }
});

// @desc    Verify OTP and Reset password
// @route   PUT /api/v1/auth/resetpassword
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return next(new ErrorResponse('Please provide email, OTP and new password', 400));
  }

  // Hash the OTP
  const hashedOtp = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');

  // Find user with matching hashed OTP and check expiration
  const user = await User.findOne({
    email,
    resetPasswordToken: hashedOtp,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Invalid OTP or OTP has expired', 400));
  }

  // Set new password
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  
  await user.save();

  // Generate new JWT token
  const token = user.getSignedJwtToken();

  res.status(200).json({
    success: true,
    token,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    message: 'Password updated successfully. You are now logged in.'
  });
  try {
    const user = await User.findById(req.user.id).select('-__v -createdAt -updatedAt');
    
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(new ErrorResponse('Failed to fetch user data', 500));
  }
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res, message = '') => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      message: message || 'Success'
    });
};