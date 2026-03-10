import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    doctorId: { type: String },
    patientName: { type: String, required: true },
    medicineName: { type: String, required: true },
    dosage: { type: String, required: true },
    instructions: { type: String },
    status: { type: String, default: 'Pending' },
    date: { type: Date, default: Date.now }
});

const Prescription = mongoose.model('Prescription', prescriptionSchema);
export default Prescription;
