import mongoose from 'mongoose';

const quoteSchema = new mongoose.Schema({
    prescriptionId: { type: String, required: true },
    patientId: { type: String, required: true },
    patientName: { type: String, required: true },
    patientEmail: { type: String, required: true },
    merchantName: { type: String, required: true },
    status: { type: String, default: 'Available' },
    medsAvailable: [{
        name: { type: String, required: true },
        price: { type: Number, required: true },
        stock: { type: String, default: 'In Stock' }
    }],
    createdAt: { type: Date, default: Date.now, expires: 86400 } // Auto-delete after 24 hours if not accepted
});

const Quote = mongoose.model('Quote', quoteSchema);
export default Quote;
