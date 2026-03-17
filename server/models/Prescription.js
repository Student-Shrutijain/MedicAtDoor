import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    doctorId: { type: String }, // User ID or Email
    doctorName: { type: String },
    patientId: { type: String }, // User ID or Email
    patientEmail: { type: String }, // Account level match
    patientName: { type: String, required: true },
    problem: { type: String, required: true },
    medicines: [{
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        duration: { type: String, required: true }, // e.g., "5 days"
        instructions: { type: String }
    }],
    status: { type: String, default: 'Pending' }, // Pending, Available, Picked
    date: { type: Date, default: Date.now }
});

const Prescription = mongoose.model('Prescription', prescriptionSchema);
export default Prescription;
