import mongoose from 'mongoose';

const symptomSchema = new mongoose.Schema({
    name: { type: String, required: true },
    icon: { type: String, required: true },
    specialty: { type: String, required: true },
    category: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Symptom = mongoose.model('Symptom', symptomSchema);
export default Symptom;
