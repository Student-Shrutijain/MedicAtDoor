import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
    patientId: { type: String, required: true },
    patientEmail: { type: String }, // Account email
    patientName: { type: String },
    doctorName: { type: String },
    symptoms: { type: String },
    medicalHistory: { type: Array },
    consultationDetails: {
        reason: String,
        duration: String,
        severity: String,
        slotDate: String,
        slotTime: String,
        mode: String,
        timestamp: Date
    },
    status: { type: String, enum: ['Pending', 'Processing', 'Fulfilled', 'Declined'], default: 'Pending' },
    historyAcknowledged: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
