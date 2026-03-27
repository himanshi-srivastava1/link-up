const User = require('../models/user');
const cloudinary = require('../cloudinary');
const asyncHandler = require('../middleware/asyncHandler');

// Get logged-in user
const getLoggedUser = asyncHandler(async (req, res) => {
    const user = await User.findOne({ _id: req.user._id });
    
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    res.json({
        success: true,
        message: 'User fetched successfully',
        data: user
    });
});

// Get all users (except current user)
const getAllUsers = asyncHandler(async (req, res) => {
    const currentUserId = req.user._id;
    const allUsers = await User.find({ _id: { $ne: currentUserId } })
        .select('firstname lastname email profilePic lastSeen isEmailVerified createdAt')
        .sort({ lastname: 1, firstname: 1 });

    if (allUsers.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'No users found'
        });
    }

    res.json({
        success: true,
        message: 'Users fetched successfully',
        data: allUsers,
        count: allUsers.length
    });
});

// Upload profile picture
const uploadProfilePic = asyncHandler(async (req, res) => {
    const { image } = req.body;

    if (!image) {
        return res.status(400).json({
            success: false,
            message: 'No image provided'
        });
    }

    // Upload to Cloudinary
    const uploadedImage = await cloudinary.uploader.upload(image, {
        folder: 'link-up/profile-pics',
        transformation: [
            { width: 500, height: 500, crop: 'fill' },
            { quality: 'auto' }
        ]
    });

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
        req.user._id, 
        { profilePic: uploadedImage.secure_url }, 
        { new: true, runValidators: true }
    ).select('firstname lastname email profilePic');

    res.json({
        success: true,
        message: 'Profile photo updated successfully',
        data: updatedUser
    });
});

// Update user profile
const updateProfile = asyncHandler(async (req, res) => {
    const { firstname, lastname } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!firstname && !lastname) {
        return res.status(400).json({
            success: false,
            message: 'At least one field (firstname or lastname) is required'
        });
    }

    // Build update object
    const updateData = {};
    if (firstname) updateData.firstname = firstname;
    if (lastname) updateData.lastname = lastname;

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
    ).select('firstname lastname email profilePic lastSeen isEmailVerified');

    if (!updatedUser) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser
    });
});

// Delete user account
const deleteAccount = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Soft delete by setting isActive to false
    const deletedUser = await User.findByIdAndUpdate(
        userId,
        { isActive: false, deletedAt: new Date() },
        { new: true }
    );

    if (!deletedUser) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    res.json({
        success: true,
        message: 'Account deleted successfully'
    });
});

// Search users
const searchUsers = asyncHandler(async (req, res) => {
    const { query, page = 1, limit = 10 } = req.query;
    const currentUserId = req.user._id;

    if (!query) {
        return res.status(400).json({
            success: false,
            message: 'Search query is required'
        });
    }

    // Build search regex
    const searchRegex = new RegExp(query, 'i');

    // Search users (exclude current user)
    const users = await User.find({
        _id: { $ne: currentUserId },
        $or: [
            { firstname: searchRegex },
            { lastname: searchRegex },
            { email: searchRegex }
        ],
        isActive: true
    })
    .select('firstname lastname email profilePic lastSeen isEmailVerified createdAt')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ lastname: 1, firstname: 1 });

    const total = await User.countDocuments({
        _id: { $ne: currentUserId },
        $or: [
            { firstname: searchRegex },
            { lastname: searchRegex },
            { email: searchRegex }
        ],
        isActive: true
    });

    res.json({
        success: true,
        message: 'Users found successfully',
        data: users,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

// Get user by ID
const getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUserId = req.user._id;

    // Find user
    const user = await User.findById(id)
        .select('firstname lastname email profilePic lastSeen createdAt isEmailVerified');

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    // Check if user is the same as current user or if they have a chat together
    // (This would require additional logic to check chat relationships)

    res.json({
        success: true,
        message: 'User fetched successfully',
        data: user
    });
});

// Update online status
const updateOnlineStatus = asyncHandler(async (req, res) => {
    const { isOnline } = req.body;
    const userId = req.user._id;

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { 
            isOnline: isOnline,
            lastSeen: isOnline ? undefined : new Date()
        },
        { new: true }
    ).select('isOnline lastSeen');

    res.json({
        success: true,
        message: 'Online status updated successfully',
        data: updatedUser
    });
});

module.exports = {
    getLoggedUser,
    getAllUsers,
    uploadProfilePic,
    updateProfile,
    deleteAccount,
    searchUsers,
    getUserById,
    updateOnlineStatus
};
