import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    specialization: { type: String, required: true },
    experience: { type: String, required: true },
    fees: { type: Number, required: true },
    status: { type: String, enum: ['Live', 'Busy', 'Away'], default: 'Live' },
    rating: { type: Number, default: 0 },
    image: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const Doctor = mongoose.model('Doctor', doctorSchema);
export default Doctor;
