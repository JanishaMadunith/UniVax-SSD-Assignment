const UserService = require("../../Services/users/UserService");

// User Registration
const registerUser = async (req, res, next) => {
    try {
        const result = await UserService.registerUser(req.body);
        res.status(201).json(result);
    } catch (error) {
        console.error("Registration error:", error);
        
        // Handle MongoDB duplicate key error (E11000)
        if (error.message.includes("duplicate")) {
            return res.status(400).json({ 
                success: false,
                message: "User already exists with this email" 
            });
        }
        
        res.status(400).json({ 
            success: false,
            message: error.message 
        });
    }
};

// User Login
const loginUser = async (req, res, next) => {
    try {
        const result = await UserService.loginUser(req.body);
        res.status(200).json(result);
    } catch (error) {
        console.error("Login error:", error);
        
        // Return 400 for validation errors (missing fields)
        if (error.message === 'Email and password are required') {
            return res.status(400).json({ 
                success: false,
                message: error.message 
            });
        }
        
        res.status(401).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Get all users (for admin purposes)
const getAllUsers = async (req, res, next) => {
    try {
        const result = await UserService.getAllUsers();
        res.status(200).json(result);
    } catch (error) {
        console.error("Get users error:", error);
        res.status(404).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Get user by ID
const getById = async (req, res, next) => {
    try {
        const result = await UserService.getUserById(req.params.id);
        res.status(200).json(result);
    } catch (error) {
        // Handle invalid ObjectId format
        if (error.message.includes("ObjectId") || error.kind === 'ObjectId') {
            return res.status(400).json({ 
                success: false,
                message: "Invalid user ID format" 
            });
        }
        
        res.status(404).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Update user by ID
const updateUser = async (req, res, next) => {
    try {
        const result = await UserService.updateUser(req.params.id, req.body);
        res.status(200).json(result);
    } catch (error) {
        // Handle invalid ObjectId format
        if (error.message.includes("ObjectId") || error.kind === 'ObjectId') {
            return res.status(400).json({ 
                success: false,
                message: "Invalid user ID format" 
            });
        }
        if (error.message === "User not found") {
            return res.status(404).json({ 
                success: false,
                message: error.message 
            });
        }
        res.status(400).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Update own profile (using JWT - no ID needed in URL)
const updateOwnProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;  // Get ID from JWT token
        const result = await UserService.updateOwnProfile(userId, req.body);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Upload profile picture
const uploadProfilePic = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        const result = await UserService.uploadProfilePic(req.user.id, req.file.buffer);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Delete user
const deleteUser = async (req, res, next) => {
    try {
        const result = await UserService.deleteUser(req.params.id);
        res.status(200).json(result);
    } catch (error) {
        // Handle invalid ObjectId format
        if (error.message.includes("ObjectId") || error.kind === 'ObjectId') {
            return res.status(400).json({ 
                success: false,
                message: "Invalid user ID format" 
            });
        }
        if (error.message === "User not found") {
            return res.status(404).json({ 
                success: false,
                message: error.message 
            });
        }
        res.status(400).json({ 
            success: false,
            message: error.message 
        });
    }
};

exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.getAllUsers = getAllUsers;
exports.getById = getById;
exports.updateUser = updateUser;
exports.updateOwnProfile = updateOwnProfile;
exports.uploadProfilePic = uploadProfilePic;
exports.deleteUser = deleteUser;

// Forgot Password
const forgotPassword = async (req, res) => {
    try {
        const result = await UserService.forgotPassword(req.body.email);
        res.status(200).json(result);
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// Reset Password
const resetPassword = async (req, res) => {
    try {
        const result = await UserService.resetPassword(req.body.token, req.body.newPassword);
        res.status(200).json(result);
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;