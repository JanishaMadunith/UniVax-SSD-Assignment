const express = require("express");
const router = express.Router();
const UserController = require("../../Controllers/users/UserControllers");
const authMiddleware = require("../../middlewares/auth.middleware");
const upload = require('../../middlewares/upload.middleware');

// Public routes
router.post("/register", UserController.registerUser);
router.post("/login", UserController.loginUser);
router.post("/forgot-password", UserController.forgotPassword);
router.post("/reset-password", UserController.resetPassword);

// Protected route: Update own profile (using JWT - no ID needed in URL)
router.put("/profile", authMiddleware(['Patient', 'Doctor', 'Admin', 'Official']), UserController.updateOwnProfile);

// Upload profile picture
router.post("/profile/upload", authMiddleware(['Patient', 'Doctor', 'Admin', 'Official']), upload.single('profilePic'), UserController.uploadProfilePic);

// User management routes
router.get("/", authMiddleware(['Admin', 'Doctor']), UserController.getAllUsers);
router.get("/:id", authMiddleware(['Patient', 'Doctor', 'Admin']), UserController.getById);
router.put("/:id", authMiddleware(['Patient', 'Doctor', 'Admin']), UserController.updateUser);
router.delete("/:id", authMiddleware(['Admin']), UserController.deleteUser);

module.exports = router;