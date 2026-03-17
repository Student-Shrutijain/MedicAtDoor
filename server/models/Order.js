import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    id: { type: String, unique: true }, // E.g., ORD-1234
    prescriptionId: { type: String }, // Links back to the broadcast
    merchantName: { type: String, required: true },
    patientName: { type: String, required: true },
    patientId: { type: String, required: true }, // Usually email
    meds: [{
        name: { type: String, required: true },
        price: { type: Number, required: true },
        stock: { type: String }
    }],
    total: { type: Number, required: true },
    status: { type: String, default: 'Pending' }, // Pending, Completed
    date: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
