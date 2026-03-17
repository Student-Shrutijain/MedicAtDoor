import mongoose from 'mongoose';

const specialtySchema = new mongoose.Schema({
    name: { type: String, required: true },
    icon: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Specialty = mongoose.model('Specialty', specialtySchema);
export default Specialty;
