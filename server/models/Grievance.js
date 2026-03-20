import mongoose from 'mongoose';

const grievanceSchema = new mongoose.Schema({
    userName: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userRole: { type: String, enum: ['Patient', 'Doctor', 'Merchant', 'Admin'], required: true },
    issueCategory: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Resolved'], default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

const Grievance = mongoose.model('Grievance', grievanceSchema);
export default Grievance;
