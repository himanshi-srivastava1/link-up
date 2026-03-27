const router = require("express").Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');


router.post('/verify-all-users', async (req, res) => {
    try {
        await User.updateMany({}, { isEmailVerified: true });
        res.json({ success: true, message: 'All users verified for testing' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


router.post('/create-test-user', async (req, res) => {
    try {
        const { firstname, lastname, email, password } = req.body;
        
    
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.json({ success: false, message: 'User already exists' });
        }

        
        const hashedPassword = await bcrypt.hash(password, 12);

        
        const newUser = new User({
            firstname,
            lastname,
            email,
            password: hashedPassword,
            isEmailVerified: true 
        });

        await newUser.save();

        res.json({ 
            success: true, 
            message: 'Test user created successfully',
            data: {
                id: newUser._id,
                email: newUser.email,
                firstname: newUser.firstname,
                lastname: newUser.lastname
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


router.get('/list-users', async (req, res) => {
    try {
        const users = await User.find({})
            .select('firstname lastname email isEmailVerified createdAt')
            .sort({ createdAt: -1 });
        
        res.json({ 
            success: true, 
            message: 'Users retrieved',
            data: users,
            count: users.length
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
