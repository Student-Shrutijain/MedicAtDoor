import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
    merchantName: { type: String, required: true, index: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    symptoms: [{ type: String }],
    inventory: { type: Number, default: 0 },
    isCustom: { type: Boolean, default: false }, // true if merchant created it directly, false if it's mirroring a global catalog item
    createdAt: { type: Date, default: Date.now }
});

const Inventory = mongoose.model('Inventory', inventorySchema);
export default Inventory;
