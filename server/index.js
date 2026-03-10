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
import User from './models/User.js';
import Appointment from './models/Appointment.js';
import HealthRecord from './models/HealthRecord.js';

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
        const doctorCount = await Doctor.countDocuments();
        if (doctorCount === 0) {
            const initialDoctors = [
                { name: 'Dr. Sarah Wilson', specialization: 'Physician', experience: '12 years', fees: 500, status: 'Live', rating: 4.8 },
                { name: 'Dr. James Miller', specialization: 'Cardiologist', experience: '15 years', fees: 1200, status: 'Busy', rating: 4.9 },
                { name: 'Dr. Elena Rodriguez', specialization: 'Pediatrician', experience: '8 years', fees: 600, status: 'Away', rating: 4.7 },
                { name: 'Dr. David Chen', specialization: 'Dermatologist', experience: '10 years', fees: 800, status: 'Live', rating: 4.6 },
                { name: 'Dr. Amara Kaur', specialization: 'Physician', experience: '5 years', fees: 400, status: 'Live', rating: 4.5 },
                { name: 'Dr. Robert Brown', specialization: 'Pediatrician', experience: '14 years', fees: 700, status: 'Live', rating: 4.9 },
                { name: 'Dr. Lisa Wang', specialization: 'Physician', experience: '9 years', fees: 550, status: 'Busy', rating: 4.6 },
                { name: 'Dr. Michael Scott', specialization: 'Gynaecologist', experience: '20 years', fees: 1500, status: 'Live', rating: 4.8 },
                { name: 'Dr. Angela Martin', specialization: 'Gynaecologist', experience: '11 years', fees: 900, status: 'Live', rating: 4.7 },
                { name: 'Dr. Oscar Martinez', specialization: 'Cardiologist', experience: '18 years', fees: 1800, status: 'Busy', rating: 4.9 },
                { name: 'Dr. Kevin Malone', specialization: 'Dietitian', experience: '7 years', fees: 400, status: 'Live', rating: 4.2 },
                { name: 'Dr. Pam Beesly', specialization: 'Dermatologist', experience: '6 years', fees: 750, status: 'Live', rating: 4.7 },
                { name: 'Dr. Jim Halpert', specialization: 'Orthopedician', experience: '10 years', fees: 1100, status: 'Live', rating: 4.8 },
                { name: 'Dr. Dwight Schrute', specialization: 'General Surgeon', experience: '15 years', fees: 2000, status: 'Busy', rating: 4.9 },
                { name: 'Dr. Stanley Hudson', specialization: 'Cardiologist', experience: '22 years', fees: 1400, status: 'Away', rating: 4.5 },
                { name: 'Dr. Phyllis Vance', specialization: 'Dietitian', experience: '12 years', fees: 600, status: 'Live', rating: 4.7 },
                { name: 'Dr. Andy Bernard', specialization: 'Physician', experience: '8 years', fees: 500, status: 'Live', rating: 4.4 },
                { name: 'Dr. Darryl Philbin', specialization: 'Orthopedician', experience: '9 years', fees: 1000, status: 'Live', rating: 4.8 },
                { name: 'Dr. Kelly Kapoor', specialization: 'Dermatologist', experience: '5 years', fees: 800, status: 'Busy', rating: 4.6 },
                { name: 'Dr. Ryan Howard', specialization: 'Pediatrician', experience: '4 years', fees: 450, status: 'Live', rating: 4.1 },
                { name: 'Dr. David Wallace', specialization: 'Cardiologist', experience: '25 years', fees: 2500, status: 'Live', rating: 5.0 },
                { name: 'Dr. Jo Bennett', specialization: 'General Surgeon', experience: '35 years', fees: 5000, status: 'Live', rating: 5.0 },
            ];
            await Doctor.insertMany(initialDoctors);
            console.log('Doctors seeded successfully');
        }

        const medCount = await Medicine.countDocuments();
        if (medCount === 0) {
            const initialMedicines = [
                { name: 'Paracetamol 500mg', category: 'General', price: 50, symptoms: ['headache', 'fever', 'pain'] },
                { name: 'Amoxicillin 250mg', category: 'Antibiotic', price: 120, symptoms: ['infection', 'throat', 'fever'] },
                { name: 'Cough Syrup (100ml)', category: 'General', price: 180, symptoms: ['cough', 'cold', 'throat'] },
                { name: 'Vitamin D3 (60k UI)', category: 'Supplement', price: 250, symptoms: ['fatigue', 'bone'] },
                { name: 'Antacid Gel', category: 'General', price: 90, symptoms: ['stomach', 'acidity', 'gas'] },
            ];
            await Medicine.insertMany(initialMedicines);
            console.log('Medicines seeded successfully');
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
        const doctors = await Doctor.find();
        res.json(doctors);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Medicines API
app.get('/api/medicines', async (req, res) => {
    try {
        const medicines = await Medicine.find();
        res.json(medicines);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Prescription API
app.post('/api/prescriptions', async (req, res) => {
    const { doctorId, patientName, medicineName, dosage, instructions } = req.body;

    try {
        const newRx = new Prescription({
            id: `RX-${Date.now()}`,
            doctorId,
            patientName,
            medicineName,
            dosage,
            instructions
        });

        await newRx.save();
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

// Orders API
app.get('/api/orders', async (req, res) => {
    try {
        const rxs = await Prescription.find().sort({ date: -1 });
        const combinedOrders = rxs.map(rx => ({
            id: rx.id,
            meds: rx.medicineName,
            qty: 1,
            status: rx.status,
            patient: rx.patientName,
            type: 'Prescription',
            mongoId: rx._id
        }));
        res.json(combinedOrders);
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
    });

    socket.on('offer', (data) => {
        socket.to(data.roomId).emit('offer', data.offer);
    });

    socket.on('answer', (data) => {
        socket.to(data.roomId).emit('answer', data.answer);
    });

    socket.on('ice-candidate', (data) => {
        socket.to(data.roomId).emit('ice-candidate', data.candidate);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected from signaling');
    });
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
