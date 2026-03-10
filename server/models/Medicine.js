import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    symptoms: [{ type: String }],
    inventory: { type: Number, default: 100 },
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    storeName: String,
    createdAt: { type: Date, default: Date.now }
});

const Medicine = mongoose.model('Medicine', medicineSchema);
export default Medicine;
