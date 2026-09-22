const User = require("../../Model/users/UserModel");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const cloudinary = require('../../config/cloudinary');

class UserService {
  // Generate JWT Token
  generateToken(userId, role, email) {
    const token = jwt.sign(
      { id: userId, role: role || 'Patient', email: email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    return token;
  }

  // User Registration
  async registerUser(data) {
    const { name, email, phone, password, confirmPassword, agreeToTerms, role, address, doctorCredentials } = data;

    // Validation
    if (!name || !email || !phone || !password || !agreeToTerms) {
      throw new Error("All fields are required");
    }

    if (password !== confirmPassword) {
      throw new Error("Passwords do not match");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    // Validate role if provided
    if (role && !['Patient', 'Doctor', 'Admin', 'Official'].includes(role)) {
      throw new Error("Invalid role. Must be Patient, Doctor, Admin, or Official");
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("User already exists with this email");
    }

    // Check if name is already taken
    const existingName = await User.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (existingName) {
      throw new Error("This name is already taken. Please use a unique name.");
    }

    // Create new user
    const user = new User({
      name,
      email,
      phone,
      password,
      agreeToTerms,
      role: role || 'Patient',
      address: address || {},
      doctorCredentials: (role === 'Doctor' && doctorCredentials) ? doctorCredentials : {},
      accountStatus: 'Active'
    });

    await user.save();

    // Generate JWT Token
    const token = this.generateToken(user._id, user.role, user.email);

    return {
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        accountStatus: user.accountStatus,
        ...(user.role === 'Doctor' && { doctorCredentials: user.doctorCredentials })
      }
    };
  }

  // User Login
  async loginUser(data) {
    const { email, password, rememberMe } = data;

    // Validation
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    // Update rememberMe if provided
    if (rememberMe !== undefined) {
      user.rememberMe = rememberMe;
      await user.save();
    }

    // Generate JWT Token
    const token = this.generateToken(user._id, user.role, user.email);

    return {
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        accountStatus: user.accountStatus,
        rememberMe: user.rememberMe,
        profilePic: user.profilePic || '',
        ...(user.role === 'Doctor' && { doctorCredentials: user.doctorCredentials })
      }
    };
  }

  // Get all users
  async getAllUsers() {
    const users = await User.find().select("-password");
    
    if (!users || users.length === 0) {
      throw new Error("No users found");
    }

    return {
      success: true,
      count: users.length,
      users
    };
  }

  // Get user by ID
  async getUserById(id) {
    const user = await User.findById(id).select("-password");
    
    if (!user) {
      throw new Error("User not found");
    }

    return {
      success: true,
      user
    };
  }

  // Update user by ID (Admin/SuperUser only)
  async updateUser(id, data) {
    const { name, email, phone, role, address, doctorCredentials, accountStatus } = data;
    
    // Validate role if provided
    if (role && !['Patient', 'Doctor', 'Admin', 'Official'].includes(role)) {
      throw new Error("Invalid role. Must be Patient, Doctor, Admin, or Official");
    }

    // Validate accountStatus if provided
    if (accountStatus && !['Active', 'Suspended', 'Pending'].includes(accountStatus)) {
      throw new Error("Invalid account status. Must be Active, Suspended, or Pending");
    }
    
    const updateData = { name, email, phone };
    if (role) updateData.role = role;
    if (address) updateData.address = address;
    if (accountStatus) updateData.accountStatus = accountStatus;
    if (role === 'Doctor' && doctorCredentials) updateData.doctorCredentials = doctorCredentials;
    
    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      throw new Error("User not found");
    }

    return {
      success: true,
      message: "User updated successfully",
      user
    };
  }

  // Upload profile pic to Cloudinary and save URL
  async uploadProfilePic(userId, buffer) {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: 'univax/profiles', transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'auto' }] },
          (error, res) => { if (error) reject(error); else resolve(res); }
        )
        .end(buffer);
    });

    const user = await User.findByIdAndUpdate(
      userId,
      { profilePic: result.secure_url },
      { new: true }
    ).select('-password');

    if (!user) throw new Error('User not found');

    return { success: true, profilePic: result.secure_url, user };
  }

  // Update own profile using JWT
  async updateOwnProfile(userId, data) {
    const { name, email, phone, address, doctorCredentials, profilePic } = data;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (profilePic) updateData.profilePic = profilePic;
    
    // Only allow doctors to update their credentials
    const user = await User.findById(userId);
    if (user.role === 'Doctor' && doctorCredentials) {
      updateData.doctorCredentials = doctorCredentials;
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      throw new Error("User not found");
    }

    return {
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    };
  }

  // Delete user by ID
  async deleteUser(id) {
    const user = await User.findByIdAndDelete(id);
    
    if (!user) {
      throw new Error("User not found");
    }

    return {
      success: true,
      message: "User deleted successfully"
    };
  }

  // Send password reset email via Brevo
  async forgotPassword(email) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Return success anyway to prevent email enumeration
      return { success: true, message: "If that email exists, a reset link has been sent." };
    }

    const resetToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const resetUrl = `${process.env.FRONTEND_URL || 'https://uni-vax.vercel.app'}/reset-password?token=${resetToken}`;

    const apiKey = (process.env.BREVO_API_KEY || '').trim();
    const senderEmail = (process.env.BREVO_SENDER_EMAIL || '').trim();
    const senderName = (process.env.BREVO_SENDER_NAME || 'UniVax Team').trim();

    const hasValidConfig = apiKey.length > 0 && senderEmail.length > 0 &&
      !apiKey.toLowerCase().includes('replace_me');

    if (hasValidConfig) {
      try {
        await axios.post(
          'https://api.brevo.com/v3/smtp/email',
          {
            sender: { name: senderName, email: senderEmail },
            to: [{ email: user.email }],
            subject: 'UniVax - Password Reset Request',
            htmlContent: `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
                <h2 style="color:#2563eb;">UniVax Password Reset</h2>
                <p>Hi <strong>${user.name}</strong>,</p>
                <p>We received a request to reset your password. Click the button below to set a new password. This link expires in <strong>15 minutes</strong>.</p>
                <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:linear-gradient(to right,#2563eb,#06b6d4);color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;margin:16px 0;">Reset Password</a>
                <p style="color:#6b7280;font-size:13px;">If you didn't request a password reset, you can safely ignore this email. Your password won't change.</p>
                <p style="color:#6b7280;font-size:13px;">Or copy this link: <a href="${resetUrl}">${resetUrl}</a></p>
              </div>
            `
          },
          { headers: { 'api-key': apiKey, 'Content-Type': 'application/json' } }
        );
        console.log('✓ Password reset email sent to', user.email);
      } catch (emailError) {
        const status = emailError?.response?.status;
        if (status === 401) {
          console.error('Brevo reset email failed (non-blocking): Unauthorized (401). Check BREVO_API_KEY in backend .env');
        } else {
          console.error('Brevo reset email failed (non-blocking):', emailError.message);
        }
      }
    } else {
      console.warn('Brevo reset email skipped: BREVO_API_KEY or BREVO_SENDER_EMAIL missing in backend .env');
      console.log('Reset URL (dev):', resetUrl);
    }

    return { success: true, message: "If that email exists, a reset link has been sent." };
  }

  // Reset password using the token from the email link
  async resetPassword(token, newPassword) {
    if (!token) throw new Error("Reset token is required");
    if (!newPassword || newPassword.length < 6) throw new Error("Password must be at least 6 characters");

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      throw new Error("Reset link is invalid or has expired. Please request a new one.");
    }

    const user = await User.findById(payload.id);
    if (!user) throw new Error("User not found");

    user.password = newPassword; // pre-save hook in UserModel will hash it
    await user.save();

    return { success: true, message: "Password reset successfully. You can now log in." };
  }
}

module.exports = new UserService();
