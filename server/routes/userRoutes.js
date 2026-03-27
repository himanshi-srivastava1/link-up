const router = require("express").Router();
const { authenticate } = require('../middleware/auth');
const {
    getLoggedUser,
    getAllUsers,
    uploadProfilePic,
    updateProfile,
    deleteAccount,
    searchUsers,
    getUserById,
    updateOnlineStatus
} = require('../controllers/userController');
const asyncHandler = require('../middleware/asyncHandler');

// Get current logged-in user
router.get('/get-logged-user', authenticate, asyncHandler(getLoggedUser));

// Get all users (except current user)
router.get('/get-all-users', authenticate, asyncHandler(getAllUsers));

// Upload profile picture
router.post('/upload-profile-pic', authenticate, asyncHandler(uploadProfilePic));

// Update user profile
router.put('/update-profile', authenticate, asyncHandler(updateProfile));

// Delete user account
router.delete('/delete-account', authenticate, asyncHandler(deleteAccount));

// Search users
router.get('/search', authenticate, asyncHandler(searchUsers));

// Get user by ID
router.get('/:id', authenticate, asyncHandler(getUserById));

// Update online status
router.put('/online-status', authenticate, asyncHandler(updateOnlineStatus));

module.exports = router;