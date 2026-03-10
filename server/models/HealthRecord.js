import mongoose from 'mongoose';

const healthRecordSchema = new mongoose.Schema({
    patientId: { type: String, required: true },
    condition: { type: String, required: true },
    diagnosed: { type: String },
    status: { type: String, enum: ['Ongoing', 'Managed', 'Resolved'], default: 'Ongoing' },
    createdAt: { type: Date, default: Date.now }
});

const HealthRecord = mongoose.model('HealthRecord', healthRecordSchema);
export default HealthRecord;
