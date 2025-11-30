const express = require('express');
const {
  getProfile,
  updateProfile,
  updatePassword
} = require('../controllers/userController');

const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes below this middleware will be protected
router.use(protect);

router
  .route('/me')
  .get(getProfile)
  .put(updateProfile);

router.put('/update-password', updatePassword);

module.exports = router;
