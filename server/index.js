import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { Server } from 'socket.io';
import http from 'http';

// Models
import Doctor from './models/Doctor.js';
import Medicine from './models/Medicine.js';
import Prescription from './models/Prescription.js';
import Order from './models/Order.js';
import Broadcast from './models/Broadcast.js';
import Quote from './models/Quote.js';
import Inventory from './models/Inventory.js';
import User from './models/User.js';
import Appointment from './models/Appointment.js';
import HealthRecord from './models/HealthRecord.js';
import Symptom from './models/Symptom.js';
import Specialty from './models/Specialty.js';
import Grievance from './models/Grievance.js';
import Admin from './models/Admin.js';

// Middleware
import { protect, authorize } from './middleware/auth.js';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: { origin: "*" }
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Ensure uploads directory exists
import fs from 'fs';
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.use('/uploads', express.static(uploadDir));

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Utility: Generate Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '30d',
    });
};

// --- AUTH ENDPOINTS ---

// Register User
app.post('/api/auth/register', async (req, res) => {
    let { name, email, password, role } = req.body;

    try {
        // Normalize role to Capitalized Case for Mongoose Enum
        if (role) {
            role = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
        }
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
            userData: {} // Empty profile to be filled
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Login User
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.comparePassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
                isVerified: user.isVerified,
                userData: user.userData
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Current User Profile
app.get('/api/auth/me', protect, async (req, res) => {
    res.json(req.user);
});

// --- ENHANCED PROFILE & REGISTRATION ---

// Update Profile (with role-specific data)
app.patch('/api/users/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { profileData, role } = req.body;

        if (profileData.phoneNumber) {
            user.phoneNumber = profileData.phoneNumber;
        }

        if (role === 'Patient') user.patientProfile = { ...user.patientProfile, ...profileData };
        if (role === 'Doctor') user.doctorProfile = { ...user.doctorProfile, ...profileData };
        if (role === 'Merchant') user.merchantProfile = { ...user.merchantProfile, ...profileData };

        user.isVerified = true; // Mark as complete after registration
        await user.save();
        res.json(user);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// File Upload Endpoint (for reports/prescriptions)
app.post('/api/upload', protect, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    res.json({ filePath: `/uploads/${req.file.filename}` });
});

// --- REST OF THE API ---

// MongoDB Connection
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB Atlas');
        seedDatabase();
    })
    .catch(err => console.error('MongoDB connection error:', err));

// Database Seeding (Initial setup)
const seedDatabase = async () => {
    try {
        const seedUsersPath = path.join(__dirname, 'data', 'users.json');
        if (fs.existsSync(seedUsersPath)) {
            const initialUsers = JSON.parse(fs.readFileSync(seedUsersPath, 'utf8'));
            for (const u of initialUsers) {
                const userExists = await User.findOne({ email: u.email });
                if (!userExists) {
                    const role = u.role.charAt(0).toUpperCase() + u.role.slice(1).toLowerCase();
                    await User.create({
                        ...u,
                        role,
                        doctorProfile: role === 'Doctor' ? {
                            specialization: u.specialization || 'General',
                            experience: u.experience || '1 Year',
                            degree: u.degree || 'MBBS',
                            status: 'Live'
                        } : undefined
                    });
                    console.log(`Seeded user: ${u.email}`);
                }
            }
        }

        const adminCount = await Admin.countDocuments();
        if (adminCount === 0) {
            const admin = new Admin({
                username: 'admin@medicatdoor.com',
                password: 'admin'
            });
            await admin.save();
            console.log('Default admin seeded.');
        }

        const doctorCount = await Doctor.countDocuments();
        if (doctorCount === 0) {
            const seedDoctorsPath = path.join(__dirname, 'data', 'seedDoctors.json');
            if (fs.existsSync(seedDoctorsPath)) {
                const initialDoctors = JSON.parse(fs.readFileSync(seedDoctorsPath, 'utf8'));
                await Doctor.insertMany(initialDoctors);
                console.log('Doctors seeded successfully');
            }
        }

        const medCount = await Medicine.countDocuments();
        if (medCount === 0) {
            const seedMedicinesPath = path.join(__dirname, 'data', 'seedMedicines.json');
            if (fs.existsSync(seedMedicinesPath)) {
                const initialMedicines = JSON.parse(fs.readFileSync(seedMedicinesPath, 'utf8'));
                await Medicine.insertMany(initialMedicines);
                console.log('Medicines seeded successfully');
            }
        }

        const symptomCount = await Symptom.countDocuments();
        if (symptomCount === 0) {
            const seedSymptomsPath = path.join(__dirname, 'data', 'seedSymptoms.json');
            if (fs.existsSync(seedSymptomsPath)) {
                const initialSymptoms = JSON.parse(fs.readFileSync(seedSymptomsPath, 'utf8'));
                await Symptom.insertMany(initialSymptoms);
                console.log('Symptoms seeded successfully');
            }
        }

        const specialtyCount = await Specialty.countDocuments();
        if (specialtyCount === 0) {
            const seedSpecialtiesPath = path.join(__dirname, 'data', 'seedSpecialties.json');
            if (fs.existsSync(seedSpecialtiesPath)) {
                const initialSpecialties = JSON.parse(fs.readFileSync(seedSpecialtiesPath, 'utf8'));
                await Specialty.insertMany(initialSpecialties);
                console.log('Specialties seeded successfully');
            }
        }
    } catch (err) {
        console.error('Seeding error:', err);
    }
};

// Basic health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'MedicAtDoor API is running with MongoDB' });
});

// Doctors API
app.get('/api/doctors', async (req, res) => {
    try {
        // First try to find users with role 'Doctor'
        const users = await User.find({ role: 'Doctor' }).select('-password');
        let mappedDoctors = users.map(u => ({
            _id: u._id,
            id: u._id,
            name: u.name,
            specialization: u.doctorProfile?.specialization || 'General',
            experience: u.doctorProfile?.experience || '1 Year',
            fees: u.doctorProfile?.fees || 0,
            status: u.doctorProfile?.status || 'Live',
            rating: u.doctorProfile?.rating || 4.5,
            image: u.doctorProfile?.image
        }));

        // Also fetch from Doctor collection (seeded data)
        const seededDoctors = await Doctor.find();
        const mappedSeeded = seededDoctors.map(d => ({
            _id: d._id,
            id: d._id,
            name: d.name,
            specialization: d.specialization,
            experience: d.experience,
            fees: d.fees,
            status: d.status,
            rating: d.rating,
            image: d.image
        }));

        res.json([...mappedDoctors, ...mappedSeeded]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Medicines API
app.get('/api/medicines', async (req, res) => {
    try {
        const query = req.query.merchantName ? { storeName: req.query.merchantName } : {};
        // We'll return all medicines for now or filter by merchantName if provided (though seed data doesn't have merchantName for all)
        const medicines = await Medicine.find(query);
        res.json(medicines);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/medicines', async (req, res) => {
    try {
        const newMed = new Medicine({
            name: req.body.name,
            category: req.body.category || 'General',
            price: req.body.price || 0,
            inventory: req.body.inventory || 0,
            storeName: req.body.merchantName
        });
        await newMed.save();
        res.status(201).json(newMed);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.patch('/api/medicines/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const updated = await Medicine.findByIdAndUpdate(id, { $set: req.body }, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// --- NEW SEPARATE INVENTORY API ---
app.get('/api/inventory', async (req, res) => {
    const { merchantName } = req.query;
    if (!merchantName) return res.status(400).json({ message: 'merchantName is required' });
    
    try {
        // 1. Fetch global catalog
        const defaultCatalog = await Medicine.find();
        
        // 2. Fetch specific merchant inventory overrides/additions
        const merchantInventory = await Inventory.find({ merchantName });
        
        // 3. Merge them
        // Start with the catalog
        const mergedMap = new Map();
        defaultCatalog.forEach(med => {
            mergedMap.set(med.name.toLowerCase(), {
                name: med.name,
                category: med.category,
                price: med.price,
                inventory: 0, // Default to 0 stock until the merchant specifically adds/edits it
                isCustom: false,
                catalogId: med._id
            });
        });
        
        // Apply merchant specific data (overrides and custom additions)
        merchantInventory.forEach(inv => {
            mergedMap.set(inv.name.toLowerCase(), {
                _id: inv._id, // True Inventory ID for patches
                name: inv.name,
                category: inv.category,
                price: inv.price,
                inventory: inv.inventory,
                isCustom: inv.isCustom
            });
        });

        res.json(Array.from(mergedMap.values()));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/inventory', async (req, res) => {
    try {
        // Force isCustom = true since they are manually adding it
        const newInv = new Inventory({ ...req.body, isCustom: true });
        await newInv.save();
        res.status(201).json(newInv);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.patch('/api/inventory/:id', async (req, res) => {
    try {
        // See if the ID belongs to an existing Inventory item
        const id = req.params.id;
        let updateData = req.body;
        
        // If the ID passed is a catalogId (no prior Inventory record), we need to create one
        const existingInv = await Inventory.findById(id);
        if (!existingInv) {
            // Check if it's actually a catalog string name or catalog ID being sent by mistake.
            // The frontend should ideally send Name or Category if creating a fresh record.
            // Assuming the frontend passes full details in body for a fresh record if id was absent:
            if(req.body.name && req.body.merchantName) {
                const freshInv = new Inventory({ ...req.body, isCustom: false });
                await freshInv.save();
                return res.json(freshInv);
            }
            return res.status(404).json({ message: 'Inventory record not found and insufficient data to create one.' });
        }

        const updated = await Inventory.findByIdAndUpdate(id, { $set: updateData }, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Symptoms API
app.get('/api/symptoms', async (req, res) => {
    try {
        const symptoms = await Symptom.find();
        res.json(symptoms);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Specialties API
app.get('/api/specialties', async (req, res) => {
    try {
        const specialties = await Specialty.find();
        res.json(specialties);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Prescription API
app.post('/api/prescriptions', async (req, res) => {
    const { doctorId, doctorName, patientId, patientEmail, patientName, medicines, problem } = req.body;

    try {
        const newRx = new Prescription({
            id: `RX-${Date.now()}`,
            doctorId,
            doctorName,
            patientId,
            patientEmail,
            patientName,
            medicines,
            problem
        });

        await newRx.save();

        // Notify patient and merchants via Socket.io
        io.emit('new-prescription', newRx);

        res.status(201).json({ message: 'Prescription created', prescription: newRx });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.get('/api/prescriptions', async (req, res) => {
    try {
        const rxs = await Prescription.find().sort({ date: -1 });
        res.json(rxs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.patch('/api/prescriptions/:id', async (req, res) => {
    try {
        const updated = await Prescription.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Appointment API
app.post('/api/appointments', async (req, res) => {
    try {
        const newAppt = new Appointment(req.body);
        await newAppt.save();
        res.status(201).json(newAppt);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.get('/api/appointments', async (req, res) => {
    const { patientId, doctorName } = req.query;
    try {
        let query = {};
        if (patientId) query.patientId = patientId;
        if (doctorName) query.doctorName = doctorName;
        const appts = await Appointment.find(query).sort({ createdAt: -1 });
        res.json(appts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.patch('/api/appointments/:id', async (req, res) => {
    try {
        const updated = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
        
        // Notify patient with granular types
        let notificationType = 'STATUS_UPDATE';
        if (req.body.status === 'Processing') notificationType = 'ACCEPTED';
        else if (req.body.status === 'Declined') notificationType = 'DECLINED';
        else if (req.body.historyAcknowledged === true) notificationType = 'HISTORY_ACKNOWLEDGED';

        io.emit('appointment-update', {
            type: notificationType,
            appointmentId: updated._id,
            status: updated.status,
            patientId: updated.patientId,
            patientEmail: updated.patientEmail,
            doctorName: updated.doctorName
        });
        
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Health Record API
app.get('/api/health-records', async (req, res) => {
    const { patientId } = req.query;
    try {
        const records = await HealthRecord.find({ patientId }).sort({ diagnosed: -1 });
        res.json(records);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/health-records', async (req, res) => {
    try {
        const newRecord = new HealthRecord(req.body);
        await newRecord.save();
        res.status(201).json(newRecord);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// User API (Profiles)
app.post('/api/users/profile', async (req, res) => {
    const { email, role, userData } = req.body;
    try {
        let user = await User.findOne({ email, role });
        if (user) {
            user.userData = userData;
            await user.save();
        } else {
            user = new User({ email, role, password: 'password123', userData });
            await user.save();
        }
        res.json(user);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.get('/api/users/profile', async (req, res) => {
    const { email, role } = req.query;
    try {
        const user = await User.findOne({ email, role });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Broadcasts API
app.get('/api/broadcasts', async (req, res) => {
    try {
        const broadcasts = await Broadcast.find().sort({ createdAt: -1 });
        res.json(broadcasts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Quotes API
app.get('/api/quotes', async (req, res) => {
    try {
        const { patientEmail } = req.query;
        const query = patientEmail ? { patientEmail } : {};
        const quotes = await Quote.find(query).sort({ createdAt: -1 });
        res.json(quotes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Orders API
app.get('/api/orders', async (req, res) => {
    const { merchantName } = req.query;
    try {
        const query = merchantName ? { merchantName } : {};
        const orders = await Order.find(query).sort({ date: -1 });
        const formattedOrders = orders.map(ord => ({
            id: ord.id,
            meds: ord.meds,
            total: ord.total,
            status: ord.status,
            patient: ord.patientName,
            patientId: ord.patientId,
            type: 'Prescription Order',
            mongoId: ord._id,
            date: ord.date
        }));
        res.json(formattedOrders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.patch('/api/orders/:id/fulfill', async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId);
        if(!order) return res.status(404).json({ message: 'Order not found' });
        
        order.status = 'Completed';
        await order.save();
        
        // Auto deduct stock
        for (const med of order.meds) {
            // Find inventory by name and merchant
            await Inventory.findOneAndUpdate(
                { name: med.name, merchantName: order.merchantName }, 
                { $inc: { inventory: -1 } }
            );
        }
        
        // Notify patient
        io.emit('patient-order-status', {
            orderId: order.id,
            status: 'Completed',
            patientId: order.patientId
        });
        
        res.json({ message: 'Order fulfilled and stock updated', order });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// WebRTC Signaling Logic
io.on('connection', (socket) => {
    console.log('User connected for signaling:', socket.id);

    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
        socket.broadcast.to(roomId).emit('user-joined');
    });

    // --- WebRTC Signaling ---
    socket.on('offer', (data) => {
        socket.broadcast.to(data.roomId).emit('offer', data.offer);
    });

    socket.on('answer', (data) => {
        socket.broadcast.to(data.roomId).emit('answer', data.answer);
    });

    socket.on('ice-candidate', (data) => {
        socket.broadcast.to(data.roomId).emit('ice-candidate', data.candidate);
    });

    // --- Video Call Chat & Sync ---
    socket.on('chat-message', (data) => {
        socket.broadcast.to(data.roomId).emit('chat-message', data);
    });

    socket.on('end-call', (data) => {
        socket.broadcast.to(data.roomId).emit('end-call');
    });

    socket.on('find-merchant', async (data) => {
        try {
            // Save to DB
            const newBroadcast = new Broadcast(data);
            await newBroadcast.save();
            
            // Notify all merchants in the room
            socket.broadcast.emit('new-merchant-request', newBroadcast);
            console.log('Merchant alert sent and saved:', data.prescriptionId);
        } catch(err) {
            console.error("Error saving broadcast:", err);
        }
    });

    socket.on('merchant-response', async (data) => {
        try {
            // data: { prescriptionId, merchantName, status, medsAvailable: [{name, price, stock}], patientEmail, patientName, patientId }
            const newQuote = new Quote(data);
            await newQuote.save();
            
            io.emit('patient-update', newQuote);
            console.log('Merchant quote sent and saved:', data.prescriptionId);
        } catch(err) {
            console.error("Error saving quote:", err);
        }
    });

    socket.on('place-order', async (data) => {
        // data: { prescriptionId, merchantName, meds: [...], total, patientName, patientId }
        try {
            const newOrder = new Order({
                id: `ORD-${Date.now().toString().slice(-4)}`,
                prescriptionId: data.prescriptionId,
                merchantName: data.merchantName,
                patientName: data.patientName,
                patientId: data.patientId,
                meds: data.meds,
                total: data.total,
                status: 'Pending'
            });
            await newOrder.save();
            
            // Clean up old broadcasts and quotes for this fulfilled prescription
            if(data.prescriptionId) {
                 await Broadcast.deleteMany({ prescriptionId: data.prescriptionId });
                 await Quote.deleteMany({ prescriptionId: data.prescriptionId });
            }
            
            // Broadcast to the target merchant
            io.emit('new-order-received', Object.assign(newOrder.toObject(), { targetMerchant: data.merchantName }));
            console.log('Order saved, broadcasted, and temporary requests cleared:', newOrder.id);
        } catch(err) {
            console.error("Error creating order from socket:", err);
        }
    });

    socket.on('order-update', (data) => {
        // data: { orderId, status, patientId }
        io.emit('patient-order-status', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected from signaling');
    });
});

// --- ADMIN API ---

// Admin Login
app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const admin = await Admin.findOne({ username });
        if (admin && (await admin.comparePassword(password))) {
            res.json({
                _id: admin._id,
                name: 'System Admin',
                email: admin.username,
                role: 'Admin',
                token: generateToken(admin._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid admin credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin Stats
app.get('/api/admin/stats', async (req, res) => {
    try {
        // Today range
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const totalPatients = (await Appointment.distinct('patientId')).length;
        const activeDoctors = await User.countDocuments({ role: 'Doctor', isVerified: true, 'doctorProfile.status': 'Live' });
        const pendingMerchants = await User.countDocuments({ role: 'Merchant', isVerified: false });
        // Assuming revenue is total of completed orders or sum of appointment fees
        const todayOrders = await Order.find({ date: { $gte: startOfDay }, status: 'Completed' });
        const todayRevenue = todayOrders.reduce((acc, order) => acc + (order.total || 0), 0);
        
        const totalAppointmentsCount = await Appointment.countDocuments();

        res.json({
            totalPatients,
            activeDoctors,
            pendingMerchants,
            todayRevenue,
            totalAppointmentsCount
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin Users Query (Get Doctors or Merchants)
app.get('/api/admin/users', async (req, res) => {
    try {
        const { role, isVerified } = req.query;
        let query = {};
        if (role) query.role = role;
        if (isVerified !== undefined) query.isVerified = isVerified === 'true';

        const users = await User.find(query).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin User Verification/Ban Handlers
app.patch('/api/admin/users/:id/verify', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if(!user) return res.status(404).json({ message: 'User not found' });
        
        user.isVerified = true;
        user.isBanned = false; // Unban if being verified
        await user.save();
        res.json({ message: 'User verified', user });
    } catch(err) {
        res.status(500).json({ message: err.message });
    }
});

app.patch('/api/admin/users/:id/ban', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if(!user) return res.status(404).json({ message: 'User not found' });
        
        user.isBanned = true;
        user.isVerified = false; // Banning invalidates verification
        if(user.role === 'Doctor' && user.doctorProfile) user.doctorProfile.status = 'Away';
        await user.save();
        res.json({ message: 'User banned', user });
    } catch(err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin Grievances
app.get('/api/admin/grievances', async (req, res) => {
    try {
        const grievances = await Grievance.find().sort({ createdAt: -1 });
        res.json(grievances);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.patch('/api/admin/grievances/:id/resolve', async (req, res) => {
    try {
        const grievance = await Grievance.findByIdAndUpdate(req.params.id, { status: 'Resolved' }, { new: true });
        res.json(grievance);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/grievances', async (req, res) => {
    try {
        const newGrievance = new Grievance(req.body);
        await newGrievance.save();
        res.status(201).json(newGrievance);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('[SERVER ERROR]', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
