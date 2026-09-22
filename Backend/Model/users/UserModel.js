const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");

const userSchema = new Schema({
    // --- basic authentication ---
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['Patient', 'Doctor', 'Admin', 'Official'], 
        default: 'Patient',
    },

    address: {
        city: { type: String, required: true },
        district: { type: String, required: true }, // Required for Health Official Analytics
        province: { type: String }
    },

    accountStatus: {
        type: String,
        enum: ['Active', 'Suspended', 'Pending'],
        default: 'Active'
    },
    agreeToTerms: {
        type: Boolean,
        required: true,
        default: false
    },

    doctorCredentials: {
        licenseNumber: { type: String },
        clinicName: { type: String },
        specialization: { type: String }
    },

    rememberMe: {
        type: Boolean,
        default: false
    },

    profilePic: {
        type: String,
        default: ''
    }
}, {
    timestamps: true // Automatically creates createdAt and updatedAt
});

// --- MIDDLEWARE: Password Hashing ---
userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// --- METHODS: Authentication Check ---
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("UserModel", userSchema);