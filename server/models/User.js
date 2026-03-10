import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['Patient', 'Doctor', 'Merchant', 'Admin'], required: true },
    // Detailed Profile Data
    patientProfile: {
        dob: Date,
        bloodGroup: String,
        age: Number,
        healthHistory: String,
        pastReports: [String] // Array of file paths/URLs
    },
    doctorProfile: {
        degree: String,
        specialization: String,
        experience: String,
        fees: Number,
        bio: String,
        availability: [String],
        status: { type: String, enum: ['Live', 'Busy', 'Away'], default: 'Live' },
        licenseCopy: String // Path to uploaded license
    },
    merchantProfile: {
        businessName: String,
        licenseNo: String,
        address: String,
        storeImage: String
    },
    phoneNumber: String,
    otp: String, // For OTP sign-in/verification
    isVerified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
