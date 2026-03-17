import mongoose from 'mongoose';

const broadcastSchema = new mongoose.Schema({
    prescriptionId: { type: String, required: true },
    patientName: { type: String, required: true },
    patientId: { type: String, required: true },
    patientEmail: { type: String, required: true },
    doctorName: { type: String },
    medicines: [{
        name: { type: String, required: true },
        dosage: { type: String },
        duration: { type: String },
        instructions: { type: String }
    }],
    createdAt: { type: Date, default: Date.now, expires: 86400 } // Auto-delete after 24 hours if not fulfilled
});

const Broadcast = mongoose.model('Broadcast', broadcastSchema);
export default Broadcast;
